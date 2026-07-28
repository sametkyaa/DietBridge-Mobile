import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { markChatConversationRead } from '../services/chatService';
import {
    buildReadContextKey,
    canMarkChatRead,
    chooseNewerCursor,
    compareChatMessagePosition,
    isCanonicalReadCandidate,
    READ_DEBOUNCE_MS,
} from '../utils/chatReadStatePolicy';
import { cursorFromReadState } from '../utils/chatDeliveryPolicy';

const READ_ERROR_MESSAGE = 'Okunma durumu şu anda güncellenemedi.';

// Isolates read-cursor lifecycle from conversation/timeline state. It writes
// only through the canonical service RPC and never infers visibility from the
// last item in history; FlatList viewability supplies the candidate instead.
export const useChatReadState = ({
    currentUserId,
    relationId,
    conversationId,
    visibleCanonicalMessage,
    ownReadState,
    isScreenFocused,
    isInitialLoading,
    hasInitialError = false,
} = {}) => {
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [readStateError, setReadStateError] = useState(null);
    const inputRef = useRef({
        currentUserId,
        relationId,
        conversationId,
        visibleCanonicalMessage,
        isScreenFocused,
        isInitialLoading,
        hasInitialError,
        appState: AppState.currentState || 'active',
    });
    const contextKeyRef = useRef(null);
    const mountedRef = useRef(true);
    const generationRef = useRef(0);
    const timerRef = useRef(null);
    const pendingCursorRef = useRef(null);
    const persistedCursorRef = useRef(null);
    const inFlightRef = useRef(null);
    const queuedCursorRef = useRef(null);
    const requestReadRef = useRef(null);

    const clearPendingTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        pendingCursorRef.current = null;
    }, []);

    const requestRead = useCallback((candidate) => {
        const input = inputRef.current;
        const contextKey = contextKeyRef.current;
        if (!contextKey || !isCanonicalReadCandidate(candidate, input.conversationId)) return;

        const currentInFlight = inFlightRef.current;
        if (currentInFlight) {
            if (currentInFlight.contextKey === contextKey
                && compareChatMessagePosition(candidate, currentInFlight.message) <= 0) return;

            const existingQueue = queuedCursorRef.current?.contextKey === contextKey
                ? queuedCursorRef.current
                : null;
            const queuedCandidate = chooseNewerCursor(existingQueue?.message || null, candidate);
            queuedCursorRef.current = {
                contextKey,
                message: queuedCandidate,
            };
            return;
        }

        if (!canMarkChatRead({
            ...input,
            visibleCanonicalMessage: candidate,
            persistedCursor: persistedCursorRef.current,
            inFlightCursor: null,
        })) return;

        const nextPending = chooseNewerCursor(pendingCursorRef.current, candidate);
        if (nextPending === pendingCursorRef.current) return;
        pendingCursorRef.current = nextPending;
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
            timerRef.current = null;
            const target = pendingCursorRef.current;
            pendingCursorRef.current = null;
            const currentInput = inputRef.current;
            const currentContextKey = contextKeyRef.current;

            if (!target || !currentContextKey || currentContextKey !== contextKey || inFlightRef.current) return;
            if (!canMarkChatRead({
                ...currentInput,
                visibleCanonicalMessage: target,
                persistedCursor: persistedCursorRef.current,
                inFlightCursor: null,
            })) return;

            const requestGeneration = generationRef.current;
            inFlightRef.current = { contextKey, message: target, generation: requestGeneration };
            if (mountedRef.current && contextKeyRef.current === contextKey) {
                setIsMarkingRead(true);
                setReadStateError(null);
            }

            Promise.resolve(markChatConversationRead({
                conversationId: currentInput.conversationId,
                lastReadMessageId: target.id,
            }))
                .then((readState) => {
                    const isCurrentContext = mountedRef.current
                        && contextKeyRef.current === contextKey
                        && generationRef.current === requestGeneration;
                    if (!isCurrentContext) return;

                    const serverCursor = cursorFromReadState(readState, 'read');
                    if (readState?.conversationId !== currentInput.conversationId
                        || !serverCursor
                        || compareChatMessagePosition(serverCursor, target) < 0) {
                        setReadStateError(READ_ERROR_MESSAGE);
                        return;
                    }

                    persistedCursorRef.current = chooseNewerCursor(persistedCursorRef.current, serverCursor);
                    setReadStateError(null);
                })
                .catch(() => {
                    if (mountedRef.current && contextKeyRef.current === contextKey
                        && generationRef.current === requestGeneration) {
                        setReadStateError(READ_ERROR_MESSAGE);
                    }
                })
                .finally(() => {
                    const completed = inFlightRef.current;
                    if (completed?.contextKey === contextKey && completed.generation === requestGeneration) {
                        inFlightRef.current = null;
                    }

                    const isCurrentContext = mountedRef.current
                        && contextKeyRef.current === contextKey
                        && generationRef.current === requestGeneration;
                    if (isCurrentContext) setIsMarkingRead(false);

                    const queued = queuedCursorRef.current;
                    if (!inFlightRef.current && queued && queued.contextKey === contextKey) {
                        queuedCursorRef.current = null;
                        requestReadRef.current?.(queued.message);
                    }
                });
        }, READ_DEBOUNCE_MS);
    }, []);

    requestReadRef.current = requestRead;

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            generationRef.current += 1;
            clearPendingTimer();
            queuedCursorRef.current = null;
        };
    }, [clearPendingTimer]);

    const contextKey = buildReadContextKey({ currentUserId, relationId, conversationId });
    useEffect(() => {
        if (contextKeyRef.current === contextKey) return;

        generationRef.current += 1;
        contextKeyRef.current = contextKey;
        clearPendingTimer();
        persistedCursorRef.current = null;
        queuedCursorRef.current = null;
        inputRef.current.visibleCanonicalMessage = null;
        if (mountedRef.current) {
            setIsMarkingRead(false);
            setReadStateError(null);
        }
    }, [clearPendingTimer, contextKey]);

    useEffect(() => {
        if (!contextKey || ownReadState?.conversationId !== conversationId
            || ownReadState?.userId !== currentUserId) return;
        const serverCursor = cursorFromReadState(ownReadState, 'read');
        if (serverCursor) {
            persistedCursorRef.current = chooseNewerCursor(persistedCursorRef.current, serverCursor);
        }
    }, [contextKey, conversationId, currentUserId, ownReadState]);

    useEffect(() => {
        inputRef.current = {
            currentUserId,
            relationId,
            conversationId,
            visibleCanonicalMessage,
            isScreenFocused,
            isInitialLoading,
            hasInitialError,
            appState: inputRef.current.appState,
        };
        if (!isScreenFocused || isInitialLoading || hasInitialError || !contextKey) {
            clearPendingTimer();
            return;
        }
        if (contextKey && visibleCanonicalMessage) requestReadRef.current?.(visibleCanonicalMessage);
    }, [clearPendingTimer, contextKey, conversationId, currentUserId, hasInitialError, isInitialLoading, isScreenFocused, relationId, visibleCanonicalMessage]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState) => {
            inputRef.current = { ...inputRef.current, appState: nextState };
            if (nextState !== 'active') {
                clearPendingTimer();
                return;
            }

            if (inputRef.current.isScreenFocused && inputRef.current.visibleCanonicalMessage) {
                requestReadRef.current?.(inputRef.current.visibleCanonicalMessage);
            }
        });
        return () => subscription.remove();
    }, [clearPendingTimer]);

    return { isMarkingRead, readStateError };
};

export default useChatReadState;
