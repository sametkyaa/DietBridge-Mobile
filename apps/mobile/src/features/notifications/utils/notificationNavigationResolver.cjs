'use strict';

const { getNotificationNavigationIntent } = require('./notificationNavigationPolicy.cjs');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);
const INVALID_DESTINATION = 'Bu bildirim artık görüntülenemiyor.';

const invalidDestination = (message = INVALID_DESTINATION) => ({
    kind: 'invalid',
    message,
});

const resolveNotificationDestinationWithDependencies = async ({
    notification,
    activeConnection,
    pendingRequest,
    getChatConversationByRelationId,
    fetchClientAppointmentById,
} = {}) => {
    const intent = getNotificationNavigationIntent(notification);

    if (intent.kind === 'invalid') return intent;

    if (intent.kind === 'chat') {
        const relationId = activeConnection?.id;
        if (
            activeConnection?.status !== 'active'
            || !isValidUuid(relationId)
            || (notification.dietitianClientId && notification.dietitianClientId !== relationId)
        ) return invalidDestination('Bu sohbet artık görüntülenemiyor.');

        try {
            const conversation = await getChatConversationByRelationId({ relationId });
            if (!conversation || conversation.id !== notification.conversationId) {
                return invalidDestination('Bu sohbet artık görüntülenemiyor.');
            }
            return {
                kind: 'chat',
                relationId,
                conversationId: conversation.id,
            };
        } catch (error) {
            return invalidDestination('Bu sohbet şu anda açılamıyor.');
        }
    }

    if (intent.kind === 'removedAppointment') return { kind: 'removedAppointment' };

    if (intent.kind === 'appointment') {
        if (!isValidUuid(notification.appointmentId)) return invalidDestination();

        try {
            const appointment = await fetchClientAppointmentById(notification.appointmentId);
            return appointment
                ? { kind: 'appointment', appointment }
                : invalidDestination('Bu randevu artık görüntülenemiyor.');
        } catch (error) {
            return invalidDestination('Bu randevu şu anda görüntülenemiyor.');
        }
    }

    if (intent.kind === 'relationship') {
        if (!isValidUuid(notification.dietitianClientId)) return invalidDestination();

        if (
            intent.eventType === 'request_pending'
            && pendingRequest?.id === notification.dietitianClientId
        ) {
            return { kind: 'relationship', destination: 'home', actionable: true };
        }

        return { kind: 'relationship', destination: 'home', actionable: false };
    }

    return invalidDestination();
};

module.exports = {
    resolveNotificationDestinationWithDependencies,
};
