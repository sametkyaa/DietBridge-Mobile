'use strict';

const {
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_EVENT_TYPES,
} = require('../constants/notificationConstants');

const invalidIntent = () => ({
    kind: 'invalid',
    message: 'Bu bildirim artık görüntülenemiyor.',
});

const getNotificationNavigationIntent = (notification) => {
    if (!notification || typeof notification !== 'object') return invalidIntent();

    if (
        notification.category === NOTIFICATION_CATEGORIES.CHAT_MESSAGE
        && NOTIFICATION_EVENT_TYPES.CHAT_MESSAGE.includes(notification.eventType)
        && notification.conversationId
    ) {
        return { kind: 'chat' };
    }

    if (
        notification.category === NOTIFICATION_CATEGORIES.APPOINTMENT
        && NOTIFICATION_EVENT_TYPES.APPOINTMENT.includes(notification.eventType)
        && notification.appointmentId
    ) {
        return notification.eventType === 'removed_from_client'
            ? { kind: 'removedAppointment' }
            : { kind: 'appointment' };
    }

    if (
        notification.category === NOTIFICATION_CATEGORIES.RELATIONSHIP
        && NOTIFICATION_EVENT_TYPES.RELATIONSHIP.includes(notification.eventType)
        && notification.dietitianClientId
    ) {
        return { kind: 'relationship', eventType: notification.eventType };
    }

    return invalidIntent();
};

module.exports = {
    getNotificationNavigationIntent,
};
