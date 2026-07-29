import { useCallback, useEffect, useRef, useState } from 'react';
import { markChatConversationDelivered } from '../services/chatService';
import {
    canAdvanceDeliveryCursor,
    chooseNewerDeliveryCursor,
    cursorFromReadState,
    selectLatestDeliverableMessage,
} from '../utils/chatDeliveryPolicy';
import { isValidUuid } from '../utils/chatMessageUtils';

const DELIVERY_ERROR_MESSAGE = 'Teslim durumu şu anda güncellenemedi.';

// Delivery means the canonical incoming message reached this device. It does
// not depend on focus or viewability; read state remains a separate lifecycle.
export const useChatDeliveryState = ({
    currentUserId,
    relationId,
    conversationId,
    messages,
    ownReadState,
} = {}) => {
    const [deliveryStateError, setDeliveryStateError] = useState(null);
    const mountedRef = useRef(true);
    const generationRef = useRef(0);
    const contextKeyRef = useRef(null);
    const inputRef = useRef({ currentUserId, relationId, conversationId });
    const persistedCursorRef = useRef(null);
    const inFlightRef = useRef(null);
    const queuedCursorRef = useRef(null);
    const requestDeliveryRef = useRef(null);

    const requestDelivery = useCallback((candidate) => {
        const input = inputRef.current;
        const contextKey = contextKeyRef.current;
        if (!contextKey || !canAdvanceDeliveryCursor({
            candidate,
            conversationId: input.conversationId,
            currentUserId: input.currentUserId,
            persistedCursor: persistedCursorRef.current,
            inFlightCursor: inFlightRef.current?.message || null,
        })) return;

        if (inFlightRef.current) {
            queuedCursorRef.current = chooseNewerDeliveryCursor(queuedCursorRef.current, candidate);
            return;
        }

        const requestGeneration = generationRef.current;
        inFlightRef.current = { contextKey, generation: requestGeneration, message: candidate };
        if (mountedRef.current) setDeliveryStateError(null);

        Promise.resolve(markChatConversationDelivered({
            conversationId: input.conversationId,
            lastDeliveredMessageId: candidate.id,
        }))
            .then((readState) => {
                if (!mountedRef.current || contextKeyRef.current !== contextKey
                    || generationRef.current !== requestGeneration) return;
                const serverCursor = cursorFromReadState(readState, 'delivered');
                persistedCursorRef.current = chooseNewerDeliveryCursor(
                    persistedCursorRef.current,
                    serverCursor || candidate,
                );
            })
            .catch(() => {
                if (mountedRef.current && contextKeyRef.current === contextKey
                    && generationRef.current === requestGeneration) {
                    setDeliveryStateError(DELIVERY_ERROR_MESSAGE);
                }
            })
            .finally(() => {
                const completed = inFlightRef.current;
                if (completed?.contextKey === contextKey && completed.generation === requestGeneration) {
                    inFlightRef.current = null;
                }
                const queued = queuedCursorRef.current;
                queuedCursorRef.current = null;
                if (queued && mountedRef.current && contextKeyRef.current === contextKey) {
                    requestDeliveryRef.current?.(queued);
                }
            });
    }, []);

    requestDeliveryRef.current = requestDelivery;
    inputRef.current = { currentUserId, relationId, conversationId };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            generationRef.current += 1;
            inFlightRef.current = null;
            queuedCursorRef.current = null;
        };
    }, []);

    const contextKey = isValidUuid(currentUserId) && isValidUuid(relationId) && isValidUuid(conversationId)
        ? `${currentUserId}:${relationId}:${conversationId}`
        : null;

    useEffect(() => {
        if (contextKeyRef.current === contextKey) return;
        generationRef.current += 1;
        contextKeyRef.current = contextKey;
        persistedCursorRef.current = null;
        inFlightRef.current = null;
        queuedCursorRef.current = null;
        if (mountedRef.current) setDeliveryStateError(null);
    }, [contextKey]);

    useEffect(() => {
        if (!contextKey || ownReadState?.conversationId !== conversationId
            || ownReadState?.userId !== currentUserId) return;
        const serverCursor = cursorFromReadState(ownReadState, 'delivered');
        if (serverCursor) {
            persistedCursorRef.current = chooseNewerDeliveryCursor(persistedCursorRef.current, serverCursor);
        }
    }, [contextKey, conversationId, currentUserId, ownReadState]);

    useEffect(() => {
        if (!contextKey) return;
        const candidate = selectLatestDeliverableMessage({ messages, conversationId, currentUserId });
        if (candidate) requestDeliveryRef.current?.(candidate);
    }, [contextKey, conversationId, currentUserId, messages]);

    return { deliveryStateError };
};

export default useChatDeliveryState;
