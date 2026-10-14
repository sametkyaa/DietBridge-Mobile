import * as Notifications from 'expo-notifications';
import { getForegroundPushBehavior } from '../utils/pushPresentationPolicy.cjs';

let userId = null;
let visibleConversation = null;

export const setForegroundPushUser = (nextUserId) => {
    if (userId !== nextUserId) visibleConversation = null;
    userId = nextUserId || null;
};

export const setVisiblePushConversation = (ownerId, conversationId) => {
    const context = { ownerId, conversationId };
    visibleConversation = context;
    return () => {
        if (visibleConversation === context) visibleConversation = null;
    };
};

Notifications.setNotificationHandler({
    handleNotification: async (notification) => getForegroundPushBehavior({
        data: notification.request.content.data,
        userId,
        visibleConversationId: visibleConversation?.ownerId === userId
            ? visibleConversation.conversationId : null,
    }),
});
