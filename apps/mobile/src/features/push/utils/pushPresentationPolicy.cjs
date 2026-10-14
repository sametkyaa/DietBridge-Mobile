'use strict';

const { isUuid } = require('./pushClientPolicy.cjs');

const getForegroundPushBehavior = ({ data, userId, visibleConversationId } = {}) => {
    const allowed = isUuid(userId) && isUuid(data?.notificationId) && data?.version === 1;
    const sameConversation = allowed && data?.category === 'chat_message'
        && isUuid(visibleConversationId) && data?.conversationId === visibleConversationId;
    return {
        shouldShowBanner: Boolean(allowed && !sameConversation),
        shouldShowList: Boolean(allowed),
        shouldPlaySound: Boolean(allowed && !sameConversation),
        shouldSetBadge: false,
    };
};

module.exports = { getForegroundPushBehavior };
