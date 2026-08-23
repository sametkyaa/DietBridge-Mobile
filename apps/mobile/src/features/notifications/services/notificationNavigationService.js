import { fetchClientAppointmentById } from '../../appointments/services/appointmentService';
import { getChatConversationByRelationId } from '../../chat/services/chatService';
import { resolveNotificationDestinationWithDependencies } from '../utils/notificationNavigationResolver.cjs';

export const resolveNotificationDestination = async ({
    notification,
    activeConnection,
    pendingRequest,
} = {}) => {
    return resolveNotificationDestinationWithDependencies({
        notification,
        activeConnection,
        pendingRequest,
        getChatConversationByRelationId,
        fetchClientAppointmentById,
    });
};

export default resolveNotificationDestination;
