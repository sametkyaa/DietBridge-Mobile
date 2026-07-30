import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import * as Crypto from 'expo-crypto';
import {
    abortChatImageUploadQuietly,
    createChatImageUploadIntent,
    finalizeChatImageMessage,
    normalizeChatImageCaption,
    uploadCanonicalChatImage,
} from '../services/chatImageService';
import { canonicalizeChatImage } from '../utils/canonicalizeChatImage';
import { createExpoCanonicalizerDeps, pickChatImage } from '../services/chatImagePicker';
import { createChatImageError, toChatImageUploadFailure } from '../utils/chatImageError';
import {
    chatImageUploadReducer,
    evaluateChatImageUploadStart,
    initialChatImageUploadState,
    resolveRetryStage,
} from '../utils/chatImageUploadReducer';
import {
    clearChatImageCanonical,
    finalizeChatImageResources,
    takeChatImageIntentForAbort,
    takeChatImagePreviewUri,
} from '../utils/chatImageUploadResources';
import { isValidUuid } from '../utils/chatMessageUtils';
import { isChatImagesFeatureEnabled } from '../utils/chatImageFeatureFlag';

// Single-slot lifecycle for canonical JPEG chat images on mobile.
//
// Selection is deliberately local-only: `selectImage` opens the system picker,
// records the chosen asset and moves to `selected`, but does not call RPC or
// Storage. `startUpload` is the only entry point that can start canonicalization
// and network work. All Supabase access stays in the service layer.

const createSecureUuid = () => {
    try {
        const value = Crypto.randomUUID();
        return isValidUuid(value) ? value : null;
    } catch {
        return null;
    }
};

// Best-effort temp-file cleanup for a canonical output owned by one operation.
const cleanupCanonicalFile = (operation) => {
    const uri = operation?.canonical?.uri;
    if (!uri) return;
    try {
        const deps = createExpoCanonicalizerDeps();
        if (typeof deps.cleanup === 'function') {
            Promise.resolve(deps.cleanup(uri)).catch(() => undefined);
        }
    } catch {
        // Cleanup must never mask the surrounding outcome.
    }
};

export const useChatImageUpload = ({
    conversationId = null,
    featureEnabled = isChatImagesFeatureEnabled(),
    canonicalizerDeps,
    pickImage = pickChatImage,
    onFinalized,
} = {}) => {
    const [state, dispatch] = useReducer(chatImageUploadReducer, initialChatImageUploadState);
    const mountedRef = useRef(false);
    const operationIdRef = useRef(0);
    const activeOperationRef = useRef(null);
    const stateRef = useRef(state);
    const onFinalizedRef = useRef(onFinalized);
    const previousConversationIdRef = useRef(conversationId);

    stateRef.current = state;
    onFinalizedRef.current = onFinalized;

    // Disposes an operation's owned resources. Aborting the controller stops any
    // in-flight staged work; the preview/canonical temp files are released.
    const disposeOperation = useCallback((operation) => {
        if (!operation) return;
        operation.controller.abort();
        takeChatImagePreviewUri(operation);
        cleanupCanonicalFile(operation);
        clearChatImageCanonical(operation);
    }, []);

    // A best-effort abort is limited to this operation's own server-issued intent.
    const releaseIntent = useCallback((operation) => {
        if (!operation) return;
        const intentId = takeChatImageIntentForAbort(operation);
        if (intentId) { void abortChatImageUploadQuietly(intentId); }
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            const operation = activeOperationRef.current;
            activeOperationRef.current = null;
            // Unmount cleanup is best-effort and only touches an active,
            // finalize-incomplete operation.
            releaseIntent(operation);
            disposeOperation(operation);
        };
    }, [disposeOperation, releaseIntent]);

    // A selection belongs to the conversation that created it. Switching the
    // active conversation clears it (and aborts only if network work had begun).
    useEffect(() => {
        if (previousConversationIdRef.current === conversationId) return;
        previousConversationIdRef.current = conversationId;
        const operation = activeOperationRef.current;
        activeOperationRef.current = null;
        releaseIntent(operation);
        disposeOperation(operation);
        dispatch({ type: 'reset' });
    }, [conversationId, disposeOperation, releaseIntent]);

    const isCurrent = useCallback((operationId) => (
        mountedRef.current
        && activeOperationRef.current !== null
        && activeOperationRef.current.operationId === operationId
        && !activeOperationRef.current.controller.signal.aborted
    ), []);

    const runStages = useCallback(async (operation, startStage) => {
        const { operationId } = operation;
        let stage = startStage;

        try {
            if (stage === 'canonicalizing') {
                const deps = canonicalizerDeps || createExpoCanonicalizerDeps();
                const canonical = await canonicalizeChatImage(operation.source, {
                    signal: operation.controller.signal,
                    deps,
                });
                if (!isCurrent(operationId)) {
                    cleanupCanonicalFile({ canonical });
                    return;
                }
                operation.canonical = canonical;
                dispatch({ type: 'canonicalized', operationId, canonical });
                stage = 'creating-intent';
            }

            const canonical = operation.canonical;
            if (!canonical) throw createChatImageError('invalid_request');

            if (stage === 'creating-intent') {
                const intent = await createChatImageUploadIntent({
                    conversationId: operation.conversationId,
                    clientMessageId: operation.clientMessageId,
                });
                if (!isCurrent(operationId)) {
                    void abortChatImageUploadQuietly(intent.id);
                    return;
                }
                operation.intent = intent;
                dispatch({ type: 'intent-created', operationId, intent });
                stage = 'uploading';
            }

            if (stage === 'uploading') {
                const intent = operation.intent;
                if (!intent) throw createChatImageError('invalid_request');
                await uploadCanonicalChatImage(intent, canonical);
                if (!isCurrent(operationId)) return;
                dispatch({ type: 'uploaded', operationId });
                stage = 'finalizing';
            }

            if (stage === 'finalizing') {
                const intentId = operation.intent?.id;
                if (!intentId) throw createChatImageError('invalid_request');
                const result = await finalizeChatImageMessage(intentId, operation.caption);
                operation.finalized = true;
                finalizeChatImageResources(operation);
                // A finalized upload never aborts. The ViewModel owns the
                // follow-up read; it must not fabricate an incomplete image
                // message if that read fails.
                cleanupCanonicalFile(operation);
                takeChatImagePreviewUri(operation);
                if (!isCurrent(operationId)) return;
                dispatch({ type: 'finalized', operationId });
                Promise.resolve(onFinalizedRef.current?.(result)).catch(() => undefined);
            }
        } catch (error) {
            const failure = toChatImageUploadFailure(error);
            if (failure.code === 'aborted' || !isCurrent(operationId)) {
                releaseIntent(operation);
                return;
            }

            const retryStage = resolveRetryStage(stateRef.current, stage, failure.retryable);
            // Keep the existing pending intent for a retryable upload/finalize
            // failure. All terminal failures release it to the expiry cleanup net.
            if (!retryStage) releaseIntent(operation);
            dispatch({ type: 'failed', operationId, error: failure, retryStage });
        }
    }, [canonicalizerDeps, isCurrent, releaseIntent]);

    // Opens the system picker and records a local selection. No RPC/Storage.
    const selectImage = useCallback(async () => {
        const operationId = ++operationIdRef.current;

        let source;
        try {
            source = await pickImage();
        } catch (error) {
            const previous = activeOperationRef.current;
            activeOperationRef.current = null;
            releaseIntent(previous);
            disposeOperation(previous);
            dispatch({ type: 'rejected', operationId, error: toChatImageUploadFailure(error) });
            return;
        }
        // User cancelled the picker: keep the current state untouched.
        if (!source) return;

        const decision = evaluateChatImageUploadStart({
            featureEnabled,
            conversationId,
            sourceMimeType: source.mimeType,
        });

        const previous = activeOperationRef.current;
        activeOperationRef.current = null;
        releaseIntent(previous);
        disposeOperation(previous);

        if (!decision.allowed || !decision.conversationId) {
            dispatch({
                type: 'rejected',
                operationId,
                error: toChatImageUploadFailure(createChatImageError(decision.reason || 'invalid_request')),
            });
            return;
        }

        const clientMessageId = createSecureUuid();
        if (!clientMessageId) {
            dispatch({
                type: 'rejected',
                operationId,
                error: toChatImageUploadFailure(createChatImageError('invalid_request')),
            });
            return;
        }

        const operation = {
            operationId,
            conversationId: decision.conversationId,
            clientMessageId,
            source,
            controller: new AbortController(),
            previewUri: source.uri,
            canonical: null,
            intent: null,
            intentReleased: false,
            caption: null,
            finalized: false,
        };
        activeOperationRef.current = operation;

        dispatch({
            type: 'select',
            operationId,
            conversationId: decision.conversationId,
            clientMessageId,
            source: {
                name: source.fileName || null,
                mimeType: source.mimeType,
                byteSize: source.byteSize ?? null,
            },
            previewUri: source.uri,
        });
    }, [conversationId, disposeOperation, featureEnabled, pickImage, releaseIntent]);

    const startUpload = useCallback(async (caption) => {
        const operation = activeOperationRef.current;
        if (!operation || stateRef.current.status !== 'selected') return;

        try {
            operation.caption = normalizeChatImageCaption(caption);
        } catch (error) {
            dispatch({
                type: 'failed',
                operationId: operation.operationId,
                error: toChatImageUploadFailure(error),
                retryStage: null,
            });
            return;
        }

        dispatch({ type: 'start', operationId: operation.operationId });
        await runStages(operation, 'canonicalizing');
    }, [runStages]);

    const retry = useCallback(async () => {
        const operation = activeOperationRef.current;
        const stage = stateRef.current.retryStage;
        if (!operation || !stage || stateRef.current.status !== 'failed') return;
        if (operation.controller.signal.aborted) return;

        dispatch({ type: 'retry', operationId: operation.operationId, stage });
        await runStages(operation, stage);
    }, [runStages]);

    const cancel = useCallback(() => {
        const operation = activeOperationRef.current;
        if (!operation) return;
        activeOperationRef.current = null;
        releaseIntent(operation);
        disposeOperation(operation);
        dispatch({ type: 'cancelled', operationId: operation.operationId });
    }, [disposeOperation, releaseIntent]);

    const reset = useCallback(() => {
        const operation = activeOperationRef.current;
        activeOperationRef.current = null;
        releaseIntent(operation);
        disposeOperation(operation);
        dispatch({ type: 'reset' });
    }, [disposeOperation, releaseIntent]);

    return useMemo(() => ({
        state,
        selectImage,
        startUpload,
        retry,
        cancel,
        reset,
        isEnabled: featureEnabled,
    }), [cancel, featureEnabled, reset, retry, selectImage, startUpload, state]);
};

export default useChatImageUpload;
