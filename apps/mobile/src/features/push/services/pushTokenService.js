import * as Notifications from 'expo-notifications';
import { isUuid, normalizeExpoPushToken } from '../utils/pushClientPolicy.cjs';

export const getExpoPushToken = async ({
    projectId,
    notifications = Notifications,
} = {}) => {
    if (!isUuid(projectId)) {
        const error = new Error('Push project configuration is missing.');
        error.code = 'PROJECT_ID_MISSING';
        throw error;
    }

    let response;
    try {
        response = await notifications.getExpoPushTokenAsync({ projectId });
    } catch {
        const error = new Error('Push token is currently unavailable.');
        error.code = 'token_unavailable';
        throw error;
    }

    const token = normalizeExpoPushToken(response?.data || response);
    if (!token) {
        const error = new Error('Push token is currently unavailable.');
        error.code = 'token_unavailable';
        throw error;
    }

    return token;
};
