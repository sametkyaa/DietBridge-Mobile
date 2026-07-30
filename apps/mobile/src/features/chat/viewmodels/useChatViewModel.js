import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Crypto from 'expo-crypto';
import {
    deleteChatMessage,
    fetchChatReadStates,
    fetchChatMessagesPage,
    fetchChatMessageById,
    getChatConversationByRelationId,
    sendChatMessage,
} from '../services/chatService';
import {
    isValidUuid,
    normalizeChatBody,
} from '../utils/chatMessageUtils';
import {
    addOptimisticMessage,
    buildChatTimeline,
    createOptimisticMessage,
    mergeLatestCanonicalHistory,
    mergeChatReadStates,
    removeOptimisticMessage,
    selectParticipantReadStates,
    updateOptimisticDeliveryState,
} from '../utils/chatViewModelUtils';
import { useChatRealtime } from '../hooks/useChatRealtime';
import { useChatReadState } from '../hooks/useChatReadState';
import { useChatDeliveryState } from '../hooks/useChatDeliveryState';
import { useChatImageUpload } from '../hooks/useChatImageUpload';
import { canDeleteChatMessage } from '../utils/chatUiUtils';
import { purgeChatImageUri, refreshChatImageUri, resolveChatImageUri } from '../services/chatImageResolver';

const GENERIC_CHAT_ERROR = 'Sohbet işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin.';
const UUID_ERROR = 'Güvenli mesaj kimliği oluşturulamadı. Lütfen tekrar deneyin.';

const getSafeErrorMessage = (error, fallback = GENERIC_CHAT_ERROR) => (
    typeof error?.userMessage === 'string' && error.userMessage.trim()
        ? error.userMessage
        : fallback
);

// Expo SDK's supported secure UUID implementation. Without a valid secure id,
// no RPC is attempted.
export const createChatClientMessageId = () => {
    let value;
    try {
        value = Crypto.randomUUID();
    } catch (error) {
        throw new Error(UUID_ERROR);
    }

    if (!isValidUuid(value)) {
        throw new Error(UUID_ERROR);
    }
    return value;
};

const getActiveRelationId = (activeConnection) => (
    activeConnection?.status === 'active' && isValidUuid(activeConnection.id)
        ? activeConnection.id
        : null
);

// Owns chat screen state and business logic. Supabase access stays entirely in
// chatService; this hook only calls the canonical service contract.
export const useChatViewModel = ({ currentUserId, activeConnection, isScreenFocused = false } = {}) => {
    const relationId = getActiveRelationId(activeConnection);
    const validCurrentUserId = isValidUuid(currentUserId) ? currentUserId : null;
    const relationKey = relationId && validCurrentUserId ? `${relationId}:${validCurrentUserId}` : null;

    const [conversation, setConversation] = useState(null);
    const [serverMessages, setServerMessages] = useState([]);
    const [optimisticMessages, setOptimisticMessages] = useState([]);
    const [readStates, setReadStates] = useState([]);
    const [draft, setDraft] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [initialError, setInitialError] = useState(null);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [loadOlderError, setLoadOlderError] = useState(null);
    const [nextCursor, setNextCursor] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const [deletingMessageIds, setDeletingMessageIds] = useState([]);
    const [bottomScrollToken, setBottomScrollToken] = useState(0);
    const [visibleCanonicalMessage, setVisibleCanonicalMessage] = useState(null);
    const [imageStates, setImageStates] = useState({});

    const isMountedRef = useRef(true);
    const requestGenerationRef = useRef(0);
    const initialRequestsRef = useRef(new Map());
    const olderRequestRef = useRef(null);
    const sendRequestsRef = useRef(new Set());
    const sendingRelationsRef = useRef(new Set());
    const deleteRequestsRef = useRef(new Set());
    const activeRelationKeyRef = useRef(relationKey);
    const conversationRef = useRef(null);
    const nextCursorRef = useRef(null);
    const serverMessagesRef = useRef([]);
    const historyConversationIdRef = useRef(null);
    const latestRefreshRef = useRef(null);
    const pendingMessageFetchRef = useRef(new Map());
    const [realtimeScrollToken, setRealtimeScrollToken] = useState(0);
    const imageRequestVersionRef = useRef(0);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            requestGenerationRef.current += 1;
            initialRequestsRef.current.clear();
            olderRequestRef.current = null;
            sendRequestsRef.current.clear();
            sendingRelationsRef.current.clear();
            deleteRequestsRef.current.clear();
            pendingMessageFetchRef.current.clear();
        };
    }, []);

    useEffect(() => {
        conversationRef.current = conversation;
    }, [conversation]);

    useEffect(() => {
        nextCursorRef.current = nextCursor;
    }, [nextCursor]);

    useEffect(() => {
        serverMessagesRef.current = serverMessages;
    }, [serverMessages]);

    const mergeServerMessages = useCallback((incomingMessages) => {
        const result = mergeLatestCanonicalHistory(serverMessagesRef.current, incomingMessages);
        serverMessagesRef.current = result.messages;
        setServerMessages(result.messages);
        return result.addedMessages;
    }, []);

    const resetForRelation = useCallback(() => {
        conversationRef.current = null;
        nextCursorRef.current = null;
        serverMessagesRef.current = [];
        historyConversationIdRef.current = null;
        latestRefreshRef.current = null;
        setConversation(null);
        setServerMessages([]);
        setOptimisticMessages([]);
        setReadStates([]);
        setDraft('');
        setIsInitialLoading(false);
        setInitialError(null);
        setIsLoadingOlder(false);
        setLoadOlderError(null);
        setNextCursor(null);
        setIsSending(false);
        setSendError(null);
        setDeleteError(null);
        setDeletingMessageIds([]);
        setVisibleCanonicalMessage(null);
    }, []);

    const loadInitial = useCallback(({ force = false } = {}) => {
        if (!relationId || !validCurrentUserId || !relationKey) {
            resetForRelation();
            return Promise.resolve(null);
        }

        const existing = initialRequestsRef.current.get(relationKey);
        if (existing && !force) return existing;

        const generation = requestGenerationRef.current;
        if (isMountedRef.current) {
            setIsInitialLoading(true);
            setInitialError(null);
            setLoadOlderError(null);
        }

        const request = (async () => {
            try {
                const nextConversation = await getChatConversationByRelationId({ relationId });
                if (!isMountedRef.current || requestGenerationRef.current !== generation
                    || activeRelationKeyRef.current !== relationKey) return null;

                if (!nextConversation) {
                    // A realtime INSERT may have resolved the lazy conversation
                    // while this relation lookup was in flight. Never move that
                    // newer state back to null with an older response.
                    if (!conversationRef.current) {
                        setConversation(null);
                        setServerMessages([]);
                        setReadStates([]);
                        setNextCursor(null);
                        historyConversationIdRef.current = null;
                    }
                    return conversationRef.current;
                }

                const [page, nextReadStates] = await Promise.all([
                    fetchChatMessagesPage({
                        conversationId: nextConversation.id,
                        currentUserId: validCurrentUserId,
                    }),
                    fetchChatReadStates({ conversationId: nextConversation.id }),
                ]);
                if (!isMountedRef.current || requestGenerationRef.current !== generation
                    || activeRelationKeyRef.current !== relationKey) return null;

                conversationRef.current = nextConversation;
                setConversation(nextConversation);
                mergeServerMessages(page.messages);
                setReadStates((current) => mergeChatReadStates(current, nextReadStates));
                setNextCursor(page.nextCursor);
                historyConversationIdRef.current = nextConversation.id;
                setBottomScrollToken((token) => token + 1);
                return nextConversation;
            } catch (error) {
                if (isMountedRef.current && requestGenerationRef.current === generation
                    && activeRelationKeyRef.current === relationKey) {
                    setInitialError(getSafeErrorMessage(error));
                }
                return null;
            } finally {
                if (initialRequestsRef.current.get(relationKey) === request) {
                    initialRequestsRef.current.delete(relationKey);
                }
                if (isMountedRef.current && requestGenerationRef.current === generation
                    && activeRelationKeyRef.current === relationKey) {
                    setIsInitialLoading(false);
                }
            }
        })();

        initialRequestsRef.current.set(relationKey, request);
        return request;
    }, [mergeServerMessages, relationId, relationKey, resetForRelation, validCurrentUserId]);

    useEffect(() => {
        // React development Strict Mode can run the effect setup twice for the
        // same mounted relation. Keep the first request authoritative instead
        // of invalidating it and then returning its stale promise.
        if (relationKey && initialRequestsRef.current.has(relationKey)) return;

        requestGenerationRef.current += 1;
        activeRelationKeyRef.current = relationKey;
        olderRequestRef.current = null;
        resetForRelation();
        if (relationKey) loadInitial();
    }, [loadInitial, relationKey, resetForRelation]);

    const retryInitialLoad = useCallback(() => loadInitial({ force: true }), [loadInitial]);

    const loadOlderMessages = useCallback(async () => {
        const currentConversation = conversationRef.current;
        const cursor = nextCursorRef.current;
        if (!relationId || !validCurrentUserId || !relationKey || !currentConversation || !cursor
            || isInitialLoading || olderRequestRef.current) return;

        const generation = requestGenerationRef.current;
        const requestKey = `${relationKey}:${cursor.createdAt}:${cursor.id}`;
        olderRequestRef.current = requestKey;
        if (isMountedRef.current) {
            setIsLoadingOlder(true);
            setLoadOlderError(null);
        }

        try {
            const page = await fetchChatMessagesPage({
                conversationId: currentConversation.id,
                currentUserId: validCurrentUserId,
                cursor,
            });
            if (!isMountedRef.current || requestGenerationRef.current !== generation
                || activeRelationKeyRef.current !== relationKey) return;

            mergeServerMessages(page.messages);
            setNextCursor(page.nextCursor);
        } catch (error) {
            if (isMountedRef.current && requestGenerationRef.current === generation
                && activeRelationKeyRef.current === relationKey) {
                setLoadOlderError(getSafeErrorMessage(error));
            }
        } finally {
            if (olderRequestRef.current === requestKey) olderRequestRef.current = null;
            if (isMountedRef.current && requestGenerationRef.current === generation
                && activeRelationKeyRef.current === relationKey) {
                setIsLoadingOlder(false);
            }
        }
    }, [isInitialLoading, mergeServerMessages, relationId, relationKey, validCurrentUserId]);

    const runSend = useCallback(async ({ clientMessageId, body, isRetry = false }) => {
        if (!relationId || !validCurrentUserId || !relationKey || !isValidUuid(clientMessageId)) return;

        const requestKey = `${relationId}:${clientMessageId}`;
        if (sendRequestsRef.current.has(requestKey)) return;
        if (!isRetry && sendingRelationsRef.current.has(relationId)) return;

        const generation = requestGenerationRef.current;
        sendRequestsRef.current.add(requestKey);
        sendingRelationsRef.current.add(relationId);
        if (isMountedRef.current && activeRelationKeyRef.current === relationKey) {
            setIsSending(true);
            setSendError(null);
            if (isRetry) {
                setOptimisticMessages((current) => updateOptimisticDeliveryState(current, clientMessageId, 'pending'));
            }
        }

        const conversationBeforeSend = conversationRef.current;
        try {
            const sentMessage = await sendChatMessage({
                relationId,
                clientMessageId,
                body,
                currentUserId: validCurrentUserId,
            });

            if (!isMountedRef.current || requestGenerationRef.current !== generation
                || activeRelationKeyRef.current !== relationKey) return;

            mergeServerMessages([sentMessage]);
            setOptimisticMessages((current) => removeOptimisticMessage(current, clientMessageId));
            setBottomScrollToken((token) => token + 1);

            // The send RPC lazily creates conversations. Re-read only when one
            // was absent before the successful send; a refresh failure does not
            // turn an already-sent canonical message into a failed bubble.
            if (!conversationBeforeSend) {
                try {
                    const refreshedConversation = await getChatConversationByRelationId({ relationId });
                    if (isMountedRef.current && requestGenerationRef.current === generation
                        && activeRelationKeyRef.current === relationKey && refreshedConversation) {
                        conversationRef.current = refreshedConversation;
                        setConversation(refreshedConversation);
                        const nextReadStates = await fetchChatReadStates({ conversationId: refreshedConversation.id });
                        if (isMountedRef.current && requestGenerationRef.current === generation
                            && activeRelationKeyRef.current === relationKey) {
                            setReadStates((current) => mergeChatReadStates(current, nextReadStates));
                        }
                    }
                } catch (error) {
                    // Intentionally retained only as a non-fatal, non-UI state.
                    // The canonical sent message remains visible.
                }
            }
        } catch (error) {
            if (isMountedRef.current && requestGenerationRef.current === generation
                && activeRelationKeyRef.current === relationKey) {
                setOptimisticMessages((current) => updateOptimisticDeliveryState(current, clientMessageId, 'failed'));
                setSendError(getSafeErrorMessage(error));
            }
        } finally {
            sendRequestsRef.current.delete(requestKey);
            sendingRelationsRef.current.delete(relationId);
            if (isMountedRef.current && requestGenerationRef.current === generation
                && activeRelationKeyRef.current === relationKey) {
                setIsSending(false);
            }
        }
    }, [mergeServerMessages, relationId, relationKey, validCurrentUserId]);

    const sendDraft = useCallback(() => {
        if (!relationId || !validCurrentUserId || !relationKey || sendingRelationsRef.current.has(relationId)) return;

        let body;
        let clientMessageId;
        try {
            body = normalizeChatBody(draft);
            clientMessageId = createChatClientMessageId();
        } catch (error) {
            if (isMountedRef.current) {
                const safeMessage = typeof error?.message === 'string' && error.message.trim()
                    ? error.message
                    : UUID_ERROR;
                setSendError(safeMessage);
            }
            return;
        }

        const optimisticMessage = createOptimisticMessage({
            relationId,
            conversationId: conversationRef.current?.id ?? null,
            currentUserId: validCurrentUserId,
            clientMessageId,
            body,
        });
        if (!optimisticMessage) {
            if (isMountedRef.current) setSendError(UUID_ERROR);
            return;
        }

        setOptimisticMessages((current) => addOptimisticMessage(current, optimisticMessage));
        setDraft('');
        setBottomScrollToken((token) => token + 1);
        runSend({ clientMessageId, body });
    }, [draft, relationId, relationKey, runSend, validCurrentUserId]);

    const retryMessage = useCallback((message) => {
        if (!message || message.deliveryState !== 'failed' || message.relationId !== relationId
            || !isValidUuid(message.clientMessageId) || typeof message.body !== 'string') return;
        runSend({ clientMessageId: message.clientMessageId, body: message.body, isRetry: true });
    }, [relationId, runSend]);

    const removeMessage = useCallback(async (message) => {
        const currentConversationId = conversationRef.current?.id ?? null;
        if (!canDeleteChatMessage(message) || message.conversationId !== currentConversationId) {
            return { ok: false, message: 'Bu mesaj silinemez.' };
        }

        const requestKey = `${currentConversationId}:${message.id}`;
        if (deleteRequestsRef.current.has(requestKey)) return { ok: false, busy: true };
        const generation = requestGenerationRef.current;
        deleteRequestsRef.current.add(requestKey);
        if (isMountedRef.current) {
            setDeletingMessageIds((current) => (current.includes(message.id) ? current : [...current, message.id]));
            setDeleteError(null);
        }

        try {
            const deletedMessage = await deleteChatMessage({ messageId: message.id });
            if (!isMountedRef.current || requestGenerationRef.current !== generation
                || activeRelationKeyRef.current !== relationKey
                || deletedMessage.conversationId !== currentConversationId) {
                return { ok: false, stale: true };
            }
            mergeServerMessages([deletedMessage]);
            return { ok: true };
        } catch (error) {
            const messageText = getSafeErrorMessage(error);
            if (isMountedRef.current && requestGenerationRef.current === generation
                && activeRelationKeyRef.current === relationKey) setDeleteError(messageText);
            return { ok: false, message: messageText };
        } finally {
            deleteRequestsRef.current.delete(requestKey);
            if (isMountedRef.current && requestGenerationRef.current === generation) {
                setDeletingMessageIds((current) => current.filter((id) => id !== message.id));
            }
        }
    }, [mergeServerMessages, relationKey]);

    // FlatList reports only normalized canonical, actually visible messages.
    // Read-state policy decides whether the candidate is safe to persist.
    const handleVisibleCanonicalMessageChange = useCallback((message) => {
        const activeConversationId = conversationRef.current?.id ?? null;
        if (message && message.conversationId !== activeConversationId) return;
        setVisibleCanonicalMessage((current) => (
            current?.id === message?.id ? current : message || null
        ));
    }, []);

    // Merges a normalized canonical realtime row only when it still belongs to
    // the active conversation. The server result wins over optimistic state by
    // id/clientMessageId, and duplicate events do not cause a second scroll.
    const mergeRealtimeMessage = useCallback((message) => {
        const currentConversationId = conversationRef.current?.id;
        if (!relationId || !relationKey || !currentConversationId
            || message?.conversationId !== currentConversationId
            || activeRelationKeyRef.current !== relationKey) return;

        const addedMessages = mergeServerMessages([message]);
        if (message.clientMessageId) {
            setOptimisticMessages((current) => removeOptimisticMessage(current, message.clientMessageId));
        }
        if (addedMessages.length) setRealtimeScrollToken((token) => token + 1);
    }, [mergeServerMessages, relationId, relationKey]);

    // Realtime image INSERTs (and any payload the normalizer rejects) arrive
    // without the embedded attachment join. This performs a single deduplicated
    // targeted fetch per message id and merges only a fully normalized image
    // message that still belongs to the active conversation. A synthetic or
    // partial message is never produced.
    const reconcileMessageById = useCallback((messageId, eventConversationId) => {
        const currentConversationId = conversationRef.current?.id ?? null;
        if (!relationId || !relationKey || !validCurrentUserId || !currentConversationId
            || activeRelationKeyRef.current !== relationKey
            || !isValidUuid(messageId)
            || eventConversationId !== currentConversationId) return;

        const pending = pendingMessageFetchRef.current;
        const fetchKey = `${currentConversationId}:${messageId}`;
        if (pending.has(fetchKey)) return;

        const generation = requestGenerationRef.current;
        const request = (async () => {
            try {
                const message = await fetchChatMessageById({
                    messageId,
                    conversationId: currentConversationId,
                    currentUserId: validCurrentUserId,
                });
                if (!message) return;
                if (!isMountedRef.current || requestGenerationRef.current !== generation
                    || activeRelationKeyRef.current !== relationKey
                    || conversationRef.current?.id !== currentConversationId
                    || message.conversationId !== currentConversationId) return;

                const addedMessages = mergeServerMessages([message]);
                if (message.clientMessageId) {
                    setOptimisticMessages((current) => removeOptimisticMessage(current, message.clientMessageId));
                }
                if (addedMessages.length) setRealtimeScrollToken((token) => token + 1);
            } catch (error) {
                // Targeted reconciliation is best-effort; the reconnect refetch
                // and lifecycle reconciliation remain the safety net.
            } finally {
                if (pending.get(fetchKey) === request) pending.delete(fetchKey);
            }
        })();
        pending.set(fetchKey, request);
    }, [mergeServerMessages, relationId, relationKey, validCurrentUserId]);

    // Conversation INSERT can arrive before the RPC's relation refetch. It is
    // metadata-only for an existing conversation and never clears history or
    // optimistic state.
    const applyRealtimeConversation = useCallback((nextConversation) => {
        if (!relationId || !relationKey || nextConversation?.relationId !== relationId
            || activeRelationKeyRef.current !== relationKey) return;

        const currentConversation = conversationRef.current;
        if (currentConversation && currentConversation.id === nextConversation.id) {
            conversationRef.current = nextConversation;
            setConversation((current) => (current?.id === nextConversation.id ? nextConversation : current));
            return;
        }

        conversationRef.current = nextConversation;
        setConversation(nextConversation);
    }, [relationId, relationKey]);

    const applyRealtimeReadState = useCallback((readState) => {
        const currentConversation = conversationRef.current;
        if (!relationId || !relationKey || !currentConversation
            || readState?.conversationId !== currentConversation.id
            || ![currentConversation.clientId, currentConversation.dietitianId].includes(readState.userId)
            || activeRelationKeyRef.current !== relationKey) return;
        setReadStates((current) => mergeChatReadStates(current, [readState]));
    }, [relationId, relationKey]);

    // Silent reconciliation used after a successful subscribe, foreground, or
    // focus return. It requests only the newest page and merges it into loaded
    // history; existing older pages and pagination anchors remain intact.
    const refreshLatestChatState = useCallback(() => {
        if (!relationId || !validCurrentUserId || !relationKey) return Promise.resolve(null);
        if (initialRequestsRef.current.has(relationKey)) return initialRequestsRef.current.get(relationKey);
        if (latestRefreshRef.current) return latestRefreshRef.current;

        const generation = requestGenerationRef.current;
        const request = (async () => {
            try {
                const refreshedConversation = await getChatConversationByRelationId({ relationId });
                if (!isMountedRef.current || requestGenerationRef.current !== generation
                    || activeRelationKeyRef.current !== relationKey || !refreshedConversation) return null;

                const previousConversationId = conversationRef.current?.id ?? null;
                if (previousConversationId && previousConversationId !== refreshedConversation.id) {
                    // Never let a stale relation response replace the active
                    // conversation or discard its loaded history.
                    return null;
                }
                conversationRef.current = refreshedConversation;
                setConversation(refreshedConversation);

                const [page, nextReadStates] = await Promise.all([
                    fetchChatMessagesPage({
                        conversationId: refreshedConversation.id,
                        currentUserId: validCurrentUserId,
                    }),
                    fetchChatReadStates({ conversationId: refreshedConversation.id }),
                ]);
                if (!isMountedRef.current || requestGenerationRef.current !== generation
                    || activeRelationKeyRef.current !== relationKey) return null;

                if (conversationRef.current?.id !== refreshedConversation.id) return null;
                const addedMessages = mergeServerMessages(page.messages);
                setReadStates((current) => mergeChatReadStates(current, nextReadStates));
                if (historyConversationIdRef.current !== refreshedConversation.id) {
                    setNextCursor(page.nextCursor);
                    historyConversationIdRef.current = refreshedConversation.id;
                }
                if (addedMessages.length) setRealtimeScrollToken((token) => token + 1);
                return refreshedConversation;
            } catch (error) {
                // Reconnect refetch is best-effort. Existing timeline and
                // composer state intentionally remain usable on failure.
                return null;
            } finally {
                if (latestRefreshRef.current === request) latestRefreshRef.current = null;
            }
        })();

        latestRefreshRef.current = request;
        return request;
    }, [mergeServerMessages, relationId, relationKey, validCurrentUserId]);

    const { connectionStatus: realtimeStatus } = useChatRealtime({
        currentUserId: validCurrentUserId,
        relationId,
        conversationId: conversation?.id ?? null,
        isScreenFocused,
        onConversation: applyRealtimeConversation,
        onMessage: mergeRealtimeMessage,
        onReconcileMessage: reconcileMessageById,
        onReadState: applyRealtimeReadState,
        onRefetchRequired: refreshLatestChatState,
    });

    const { ownReadState, peerReadState } = useMemo(() => selectParticipantReadStates({
        readStates,
        currentUserId: validCurrentUserId,
        conversation,
    }), [conversation, readStates, validCurrentUserId]);

    const { deliveryStateError } = useChatDeliveryState({
        currentUserId: validCurrentUserId,
        relationId,
        conversationId: conversation?.id ?? null,
        messages: serverMessages,
        ownReadState,
    });

    const { isMarkingRead, readStateError } = useChatReadState({
        currentUserId: validCurrentUserId,
        relationId,
        conversationId: conversation?.id ?? null,
        visibleCanonicalMessage,
        ownReadState,
        isScreenFocused,
        isInitialLoading,
        hasInitialError: Boolean(initialError),
    });

    const timelineMessages = useMemo(() => (
        buildChatTimeline(serverMessages, optimisticMessages, relationId)
    ), [optimisticMessages, relationId, serverMessages]);

    // Image reads remain available independently of the send feature flag. The
    // generation guard prevents an old conversation/foreground request from
    // writing signed URLs into the currently active conversation.
    const resolveImageMessages = useCallback(async (forceRefresh = false) => {
        const generation = ++imageRequestVersionRef.current;
        const activeConversationId = conversationRef.current?.id ?? null;
        const imageMessages = serverMessages.filter((message) => message?.messageKind === 'image');
        imageMessages.forEach((message) => { if (!message?.attachment || message.isDeleted || message.attachment.deletedAt) purgeChatImageUri(message); });
        setImageStates(Object.fromEntries(imageMessages.map((message) => [message.id, { uri: null, status: 'loading' }])));
        const results = await Promise.all(imageMessages.map((message) => (
            forceRefresh ? refreshChatImageUri(message) : resolveChatImageUri(message)
        )));
        if (!isMountedRef.current || imageRequestVersionRef.current !== generation
            || conversationRef.current?.id !== activeConversationId) return;
        setImageStates(Object.fromEntries(imageMessages.map((message, index) => [message.id, results[index]])));
    }, [serverMessages]);

    useEffect(() => { void resolveImageMessages(); }, [conversation?.id, resolveImageMessages]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') void resolveImageMessages(true);
        });
        return () => subscription.remove();
    }, [resolveImageMessages]);

    const retryImage = useCallback((message) => { void resolveImageMessages(true); }, [resolveImageMessages]);

    // Optional canonical-JPEG image sending. The feature flag defaults off, so
    // this hook is inert (picker hidden) unless EXPO_PUBLIC_ENABLE_CHAT_IMAGES
    // is exactly 'true'. Finalized uploads reconcile through the same targeted
    // fetch used by realtime, so only a fully normalized image message enters
    // the timeline.
    const handleImageFinalized = useCallback((result) => {
        if (!result || !isValidUuid(result.messageId) || !isValidUuid(result.conversationId)) return;
        reconcileMessageById(result.messageId, conversationRef.current?.id ?? null);
    }, [reconcileMessageById]);

    const imageUpload = useChatImageUpload({
        conversationId: conversation?.id ?? null,
        onFinalized: handleImageFinalized,
    });

    return {
        relationId,
        conversation,
        serverMessages,
        optimisticMessages,
        timelineMessages,
        draft,
        setDraft,
        isInitialLoading,
        initialError,
        retryInitialLoad,
        isLoadingOlder,
        loadOlderError,
        loadOlderMessages,
        nextCursor,
        isSending,
        sendError,
        sendDraft,
        retryMessage,
        removeMessage,
        deleteError,
        deletingMessageIds,
        peerReadState,
        handleVisibleCanonicalMessageChange,
        isMarkingRead,
        readStateError,
        deliveryStateError,
        canSend: Boolean(relationId && validCurrentUserId),
        bottomScrollToken,
        realtimeScrollToken,
        realtimeStatus,
        imageUpload,
        imageStates,
        retryImage,
    };
};

export default useChatViewModel;
