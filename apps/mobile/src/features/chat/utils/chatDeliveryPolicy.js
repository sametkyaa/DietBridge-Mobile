'use strict';

const {
    isCanonicalChatMessage,
    isValidUuid,
    normalizeIsoTimestamp,
} = require('./chatMessageUtils');
const { compareChatMessagePosition, chooseNewerCursor } = require('./chatReadStatePolicy');

const isCanonicalIncomingMessage = ({ message, conversationId, currentUserId } = {}) => (
    isCanonicalChatMessage(message)
    && isValidUuid(conversationId)
    && isValidUuid(currentUserId)
    && message.conversationId === conversationId
    && message.senderId !== currentUserId
    && message.isOwn === false
);

const selectLatestDeliverableMessage = ({ messages, conversationId, currentUserId } = {}) => {
    const candidates = (Array.isArray(messages) ? messages : []).filter((message) => (
        isCanonicalIncomingMessage({ message, conversationId, currentUserId })
    ));
    if (candidates.length === 0) return null;
    return candidates.reduce((latest, message) => (
        compareChatMessagePosition(message, latest) > 0 ? message : latest
    ));
};

const cursorFromReadState = (readState, type = 'delivered') => {
    const id = type === 'read' ? readState?.lastReadMessageId : readState?.lastDeliveredMessageId;
    const createdAt = type === 'read' ? readState?.lastReadAt : readState?.lastDeliveredAt;
    if (!isValidUuid(id) || normalizeIsoTimestamp(createdAt) === null) return null;
    return { id, createdAt };
};

const canAdvanceDeliveryCursor = ({ candidate, conversationId, currentUserId, persistedCursor, inFlightCursor } = {}) => {
    if (!isCanonicalIncomingMessage({ message: candidate, conversationId, currentUserId })) return false;
    if (persistedCursor && compareChatMessagePosition(candidate, persistedCursor) <= 0) return false;
    if (inFlightCursor && compareChatMessagePosition(candidate, inFlightCursor) <= 0) return false;
    return true;
};

module.exports = {
    isCanonicalIncomingMessage,
    selectLatestDeliverableMessage,
    cursorFromReadState,
    canAdvanceDeliveryCursor,
    chooseNewerDeliveryCursor: chooseNewerCursor,
};
