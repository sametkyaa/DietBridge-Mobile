'use strict';

// Pure timeline/state helpers for the chat ViewModel. This module deliberately
// stays free of React, Expo, and native imports so the existing Node test
// runner can exercise its behaviour.

const {
    isCanonicalChatMessage,
    isValidUuid,
    mergeCanonicalChatMessages,
} = require('./chatMessageUtils');

const getClientMessageKey = (message) => (
    typeof message?.clientMessageId === 'string' && message.clientMessageId
        ? message.clientMessageId
        : null
);

const isOptimisticChatMessage = (message) => Boolean(message)
    && typeof message === 'object'
    && message.id === null
    && typeof message.optimisticId === 'string'
    && typeof message.body === 'string'
    && Boolean(message.body.trim())
    && (message.deliveryState === 'pending' || message.deliveryState === 'failed');

const compareTimelineMessages = (left, right) => {
    const timeDifference = (Date.parse(left.createdAt) || 0) - (Date.parse(right.createdAt) || 0);
    if (timeDifference !== 0) return timeDifference;

    const leftKey = left.id || left.optimisticId || left.clientMessageId || '';
    const rightKey = right.id || right.optimisticId || right.clientMessageId || '';
    return leftKey.localeCompare(rightKey);
};

// A canonical server message always wins over an optimistic message that has
// the same non-empty clientMessageId. Null ids are never used as a dedupe key.
const buildChatTimeline = (serverMessages, optimisticMessages, relationId) => {
    const canonicalMessages = mergeCanonicalChatMessages([], serverMessages);
    const serverClientMessageIds = new Set(
        canonicalMessages.map(getClientMessageKey).filter(Boolean),
    );
    const optimistic = (Array.isArray(optimisticMessages) ? optimisticMessages : [])
        .filter(isOptimisticChatMessage)
        .filter((message) => !relationId || message.relationId === relationId)
        .filter((message) => !serverClientMessageIds.has(getClientMessageKey(message)));

    return [...canonicalMessages, ...optimistic].sort(compareTimelineMessages);
};

// Latest-history refreshes return only the newest page. Merge that page into
// the loaded canonical timeline so old pagination remains intact, and expose
// which canonical rows are genuinely new so the view model can move a
// near-bottom FlatList without creating duplicate bubbles.
const mergeLatestCanonicalHistory = (existingMessages, latestMessages) => {
    const existing = Array.isArray(existingMessages) ? existingMessages : [];
    const existingIds = new Set(
        existing
            .filter(isCanonicalChatMessage)
            .map((message) => message.id),
    );
    const messages = mergeCanonicalChatMessages(existing, latestMessages);
    const addedMessages = messages.filter((message) => !existingIds.has(message.id));

    return { messages, addedMessages };
};

const addOptimisticMessage = (messages, message) => {
    const current = Array.isArray(messages) ? messages : [];
    if (!isOptimisticChatMessage(message)) return [...current];
    if (current.some((item) => item?.optimisticId === message.optimisticId)) return [...current];
    return [...current, message];
};

const updateOptimisticDeliveryState = (messages, clientMessageId, deliveryState) => (
    (Array.isArray(messages) ? messages : []).map((message) => (
        message?.clientMessageId === clientMessageId
            ? { ...message, deliveryState }
            : message
    ))
);

const removeOptimisticMessage = (messages, clientMessageId) => (
    (Array.isArray(messages) ? messages : []).filter((message) => message?.clientMessageId !== clientMessageId)
);

const mergeChatReadStates = (existingStates, incomingStates) => {
    const byUserId = new Map();
    const push = (state) => {
        if (!state || !isValidUuid(state.conversationId) || !isValidUuid(state.userId)) return;
        const current = byUserId.get(state.userId);
        if (!current) {
            byUserId.set(state.userId, state);
            return;
        }

        const currentTime = Date.parse(current.updatedAt) || 0;
        const nextTime = Date.parse(state.updatedAt) || 0;
        if (nextTime >= currentTime) byUserId.set(state.userId, state);
    };

    (Array.isArray(existingStates) ? existingStates : []).forEach(push);
    (Array.isArray(incomingStates) ? incomingStates : []).forEach(push);
    return [...byUserId.values()];
};

const selectParticipantReadStates = ({ readStates, currentUserId, conversation } = {}) => {
    if (!isValidUuid(currentUserId) || !conversation || !isValidUuid(conversation.id)) {
        return { ownReadState: null, peerReadState: null };
    }

    const peerUserId = currentUserId === conversation.clientId
        ? conversation.dietitianId
        : currentUserId === conversation.dietitianId
            ? conversation.clientId
            : null;
    if (!isValidUuid(peerUserId)) return { ownReadState: null, peerReadState: null };

    const states = Array.isArray(readStates) ? readStates : [];
    return {
        ownReadState: states.find((state) => state?.conversationId === conversation.id && state.userId === currentUserId) || null,
        peerReadState: states.find((state) => state?.conversationId === conversation.id && state.userId === peerUserId) || null,
    };
};

const createOptimisticMessage = ({
    relationId,
    conversationId,
    currentUserId,
    clientMessageId,
    body,
    createdAt = new Date().toISOString(),
}) => {
    if (!isValidUuid(relationId) || !isValidUuid(currentUserId) || !isValidUuid(clientMessageId)) return null;
    if (conversationId !== null && conversationId !== undefined && !isValidUuid(conversationId)) return null;
    if (typeof body !== 'string' || !body.trim()) return null;

    return {
        id: null,
        optimisticId: clientMessageId,
        relationId,
        conversationId: conversationId || null,
        senderId: currentUserId,
        clientMessageId,
        body,
        createdAt,
        isOwn: true,
        deliveryState: 'pending',
    };
};

module.exports = {
    buildChatTimeline,
    mergeLatestCanonicalHistory,
    addOptimisticMessage,
    updateOptimisticDeliveryState,
    removeOptimisticMessage,
    createOptimisticMessage,
    mergeChatReadStates,
    selectParticipantReadStates,
};
