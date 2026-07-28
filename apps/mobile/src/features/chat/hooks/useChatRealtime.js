import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
    subscribeToChatConversation,
    subscribeToChatMessages,
    subscribeToChatReadStates,
} from '../services/chatRealtimeService';
import {
    createChatRealtimeRefreshScheduler,
    isRealtimeContextCurrent,
    normalizeSubscriptionStatus,
} from '../utils/chatRealtimePolicy';
import { isValidUuid } from '../utils/chatMessageUtils';

const isActiveAppState = (state) => state === 'active';

// Owns only subscription/lifecycle plumbing. Conversation and timeline state
// remain in useChatViewModel through the supplied callbacks.
export const useChatRealtime = ({
    currentUserId,
    relationId,
    conversationId,
    isScreenFocused = false,
    onConversation,
    onMessage,
    onReadState,
    onRefetchRequired,
} = {}) => {
    const [appState, setAppState] = useState(() => AppState.currentState || 'active');
    const [connectionStatus, setConnectionStatus] = useState('idle');
    const contextRef = useRef({ currentUserId, relationId, conversationId });
    const callbacksRef = useRef({ onConversation, onMessage, onReadState, onRefetchRequired });
    const generationRef = useRef(0);

    useEffect(() => {
        contextRef.current = { currentUserId, relationId, conversationId };
        callbacksRef.current = { onConversation, onMessage, onReadState, onRefetchRequired };
    }, [conversationId, currentUserId, onConversation, onMessage, onReadState, onRefetchRequired, relationId]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', setAppState);
        return () => subscription.remove();
    }, []);

    useEffect(() => {
        const canSubscribe = isActiveAppState(appState)
            && isScreenFocused
            && isValidUuid(currentUserId)
            && isValidUuid(relationId);
        if (!canSubscribe) {
            setConnectionStatus('idle');
            return undefined;
        }

        const generation = generationRef.current + 1;
        generationRef.current = generation;
        const eventUserId = currentUserId;
        const eventRelationId = relationId;
        const eventConversationId = isValidUuid(conversationId) ? conversationId : null;
        const scheduler = createChatRealtimeRefreshScheduler({
            onRefresh: () => callbacksRef.current.onRefetchRequired?.(),
        });
        const isCurrent = (expectedConversationId) => (
            generationRef.current === generation
            && isRealtimeContextCurrent({
                ...contextRef.current,
                eventUserId,
                eventRelationId,
                eventConversationId: expectedConversationId,
            })
        );
        const handleStatus = (status) => {
            if (!isCurrent(eventConversationId)) return;
            const normalized = normalizeSubscriptionStatus(status);
            setConnectionStatus(normalized.status);
            if (normalized.shouldRefetch) scheduler.notify();
        };

        const conversationSubscription = subscribeToChatConversation({
            relationId,
            onConversation: (conversation) => {
                if (!isCurrent(undefined) || conversation.relationId !== eventRelationId) return;
                callbacksRef.current.onConversation?.(conversation);
                scheduler.notify();
            },
            onStatus: handleStatus,
        });

        const messageSubscription = eventConversationId
            ? subscribeToChatMessages({
                conversationId: eventConversationId,
                currentUserId,
                onMessage: (message) => {
                    if (!isCurrent(eventConversationId) || message.conversationId !== eventConversationId) return;
                    callbacksRef.current.onMessage?.(message);
                },
                onStatus: handleStatus,
            })
            : null;

        const readStateSubscription = eventConversationId
            ? subscribeToChatReadStates({
                conversationId: eventConversationId,
                onReadState: (readState) => {
                    if (!isCurrent(eventConversationId) || readState.conversationId !== eventConversationId) return;
                    callbacksRef.current.onReadState?.(readState);
                },
                onStatus: handleStatus,
            })
            : null;

        // Foregrounding or returning to the chat must reconcile the latest
        // canonical page even if the Realtime transport does not emit a new
        // SUBSCRIBED callback for an already-established channel.
        scheduler.notify();

        return () => {
            generationRef.current += 1;
            scheduler.dispose();
            Promise.resolve(messageSubscription?.unsubscribe()).catch(() => undefined);
            Promise.resolve(readStateSubscription?.unsubscribe()).catch(() => undefined);
            Promise.resolve(conversationSubscription.unsubscribe()).catch(() => undefined);
        };
    }, [appState, conversationId, currentUserId, isScreenFocused, relationId]);

    return { connectionStatus };
};

export default useChatRealtime;
