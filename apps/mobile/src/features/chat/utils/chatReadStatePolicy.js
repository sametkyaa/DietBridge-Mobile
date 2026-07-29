'use strict';

const { isCanonicalChatMessage, isValidUuid, normalizeIsoTimestamp } = require('./chatMessageUtils');

const READ_DEBOUNCE_MS = 200;

const compareChatMessagePosition = (left, right) => {
    const leftTime = normalizeIsoTimestamp(left?.createdAt);
    const rightTime = normalizeIsoTimestamp(right?.createdAt);
    if (!leftTime || !rightTime || !isValidUuid(left?.id) || !isValidUuid(right?.id)) return 0;

    const timeDifference = Date.parse(leftTime) - Date.parse(rightTime);
    if (timeDifference !== 0) return timeDifference;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
};

const isCanonicalReadCandidate = (message, conversationId) => (
    isCanonicalChatMessage(message)
    && isValidUuid(conversationId)
    && message.conversationId === conversationId
    && message.isOwn === false
);

const selectLatestVisibleCanonicalMessage = ({ viewableItems, conversationId } = {}) => {
    const candidates = (Array.isArray(viewableItems) ? viewableItems : [])
        .filter((viewToken) => viewToken?.isViewable)
        .map((viewToken) => viewToken.item)
        .filter((message) => isCanonicalReadCandidate(message, conversationId));

    if (candidates.length === 0) return null;
    return candidates.reduce((latest, message) => (
        compareChatMessagePosition(message, latest) > 0 ? message : latest
    ));
};

const chooseNewerCursor = (currentCursor, candidate) => {
    if (!candidate) return currentCursor || null;
    if (!currentCursor || compareChatMessagePosition(candidate, currentCursor) > 0) return candidate;
    return currentCursor;
};

const canMarkChatRead = ({
    currentUserId,
    relationId,
    conversationId,
    visibleCanonicalMessage,
    isScreenFocused,
    appState,
    isInitialLoading,
    hasInitialError,
    persistedCursor,
    inFlightCursor,
} = {}) => {
    if (!isValidUuid(currentUserId) || !isValidUuid(relationId) || !isValidUuid(conversationId)) return false;
    if (!isScreenFocused || appState !== 'active' || isInitialLoading || hasInitialError) return false;
    if (!isCanonicalReadCandidate(visibleCanonicalMessage, conversationId)) return false;
    if (persistedCursor && compareChatMessagePosition(visibleCanonicalMessage, persistedCursor) <= 0) return false;
    if (inFlightCursor && compareChatMessagePosition(visibleCanonicalMessage, inFlightCursor) <= 0) return false;
    return true;
};

const buildReadContextKey = ({ currentUserId, relationId, conversationId } = {}) => (
    isValidUuid(currentUserId) && isValidUuid(relationId) && isValidUuid(conversationId)
        ? `${currentUserId}:${relationId}:${conversationId}`
        : null
);

module.exports = {
    READ_DEBOUNCE_MS,
    compareChatMessagePosition,
    isCanonicalReadCandidate,
    selectLatestVisibleCanonicalMessage,
    chooseNewerCursor,
    canMarkChatRead,
    buildReadContextKey,
};
