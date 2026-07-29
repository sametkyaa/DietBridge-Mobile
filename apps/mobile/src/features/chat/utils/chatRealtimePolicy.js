'use strict';

// Pure realtime policy. It contains no Supabase or React Native imports so
// channel rules and reconnect coalescing can be tested without a connection.

const { isValidUuid } = require('./chatMessageUtils');

const CHAT_REALTIME_DEBOUNCE_MS = 150;

const buildConversationChannelConfig = (relationId) => {
    if (!isValidUuid(relationId)) return null;
    return {
        channelName: `mobile-chat-conversation:${relationId}`,
        filter: `dietitian_client_id=eq.${relationId}`,
    };
};

const buildMessageChannelConfig = (conversationId) => {
    if (!isValidUuid(conversationId)) return null;
    return {
        channelName: `mobile-chat-messages:${conversationId}`,
        filter: `conversation_id=eq.${conversationId}`,
    };
};

const buildReadStateChannelConfig = (conversationId) => {
    if (!isValidUuid(conversationId)) return null;
    return {
        channelName: `mobile-chat-read-states:${conversationId}`,
        filter: `conversation_id=eq.${conversationId}`,
    };
};

const normalizeSubscriptionStatus = (status) => {
    switch (status) {
        case 'SUBSCRIBED':
            return { status: 'connected', shouldRefetch: true };
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
            return { status: 'degraded', shouldRefetch: false };
        case 'CLOSED':
            return { status: 'disconnected', shouldRefetch: false };
        default:
            return { status: 'connecting', shouldRefetch: false };
    }
};

const isConversationForRelation = (conversation, relationId) => (
    Boolean(conversation)
    && isValidUuid(relationId)
    && conversation.relationId === relationId
);

const isMessageForConversation = (message, conversationId) => (
    Boolean(message)
    && isValidUuid(conversationId)
    && message.conversationId === conversationId
);

const isRealtimeContextCurrent = ({
    currentUserId,
    relationId,
    conversationId,
    eventUserId,
    eventRelationId,
    eventConversationId,
}) => (
    isValidUuid(currentUserId)
    && currentUserId === eventUserId
    && relationId === eventRelationId
    && (eventConversationId === undefined || conversationId === eventConversationId)
);

// Collapses bursts (subscribe, focus, foreground and conversation events) into
// one refresh. A request arriving while refresh is in progress schedules at
// most one trailing pass. No polling or manual reconnect loop is created.
const createChatRealtimeRefreshScheduler = ({ delayMs = CHAT_REALTIME_DEBOUNCE_MS, onRefresh } = {}) => {
    let timer = null;
    let inFlight = false;
    let trailingRequested = false;
    let disposed = false;

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const run = () => {
        if (disposed) return;
        if (inFlight) {
            trailingRequested = true;
            return;
        }
        if (typeof onRefresh !== 'function') return;

        inFlight = true;
        let result;
        try {
            result = onRefresh();
        } catch (error) {
            result = Promise.reject(error);
        }

        Promise.resolve(result)
            .catch(() => undefined)
            .then(() => {
                inFlight = false;
                if (trailingRequested) {
                    trailingRequested = false;
                    notify();
                }
            });
    };

    const notify = () => {
        if (disposed) return;
        clearTimer();
        timer = setTimeout(() => {
            timer = null;
            run();
        }, delayMs);
    };

    const clearPending = () => {
        clearTimer();
        trailingRequested = false;
    };

    const dispose = () => {
        disposed = true;
        clearPending();
    };

    return { notify, clearPending, dispose };
};

module.exports = {
    CHAT_REALTIME_DEBOUNCE_MS,
    buildConversationChannelConfig,
    buildMessageChannelConfig,
    buildReadStateChannelConfig,
    normalizeSubscriptionStatus,
    isConversationForRelation,
    isMessageForConversation,
    isRealtimeContextCurrent,
    createChatRealtimeRefreshScheduler,
};
