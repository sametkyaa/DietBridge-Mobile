const getInitialChatPositionKey = ({ conversationId, initialPositionToken }) => (
    conversationId ? `${conversationId}:${initialPositionToken}` : null
);

const shouldPositionInitialChat = ({
    conversationId,
    initialPositionToken,
    messageCount,
    positionedKey,
}) => {
    const positionKey = getInitialChatPositionKey({ conversationId, initialPositionToken });
    return Boolean(positionKey && messageCount > 0 && positionedKey !== positionKey);
};

const shouldAdjustInitialChatLayout = ({
    conversationId,
    initialPositionToken,
    positionedKey,
    adjustedKey,
    isNearBottom,
}) => {
    const positionKey = getInitialChatPositionKey({ conversationId, initialPositionToken });
    return Boolean(positionKey && positionedKey === positionKey && adjustedKey !== positionKey && isNearBottom);
};

module.exports = {
    getInitialChatPositionKey,
    shouldPositionInitialChat,
    shouldAdjustInitialChatLayout,
};
