import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import {
    getAndroidChannelConfigs,
    normalizePermissionState,
} from '../utils/pushClientPolicy.cjs';

const getRuntimeInputs = ({
    platform = Platform.OS,
    device = Device,
    constants = Constants,
} = {}) => ({
    platform,
    isDevice: device?.isDevice === true,
    appOwnership: constants?.appOwnership || null,
});

export const getPushPermissionState = async ({
    notifications = Notifications,
    ...runtimeOptions
} = {}) => {
    const runtime = getRuntimeInputs(runtimeOptions);
    if (!['android', 'ios'].includes(runtime.platform) || !runtime.isDevice) {
        return normalizePermissionState({ ...runtime, permissionResponse: null });
    }

    const response = await notifications.getPermissionsAsync();
    return normalizePermissionState({ ...runtime, permissionResponse: response });
};

export const requestPushPermission = async ({
    notifications = Notifications,
    ...runtimeOptions
} = {}) => {
    const runtime = getRuntimeInputs(runtimeOptions);
    const response = await notifications.requestPermissionsAsync({
        ios: {
            allowAlert: true,
            allowSound: true,
            allowBadge: false,
            allowProvisional: true,
        },
        android: {},
    });
    return normalizePermissionState({ ...runtime, permissionResponse: response });
};

export const ensureAndroidNotificationChannels = async ({
    notifications = Notifications,
    platform = Platform.OS,
} = {}) => {
    if (platform !== 'android' || typeof notifications.setNotificationChannelAsync !== 'function') return [];

    const configs = getAndroidChannelConfigs({ importance: notifications.AndroidImportance || {} });
    const channels = [];
    for (const config of configs) {
        const { id, ...channel } = config;
        channels.push(await notifications.setNotificationChannelAsync(id, channel));
    }
    return channels;
};
