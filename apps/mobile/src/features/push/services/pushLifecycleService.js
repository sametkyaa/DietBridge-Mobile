import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { createPushLifecycleController as createCoreController } from '../utils/pushLifecycleController.cjs';
import { getOrCreatePushInstallationId } from './pushInstallationId';
import { resolveEasProjectId, getPushAppInfo } from './pushProjectConfig';
import {
    ensureAndroidNotificationChannels,
    getPushPermissionState,
    requestPushPermission,
} from './pushPermissions';
import { getExpoPushToken } from './pushTokenService';
import { registerPushInstallation } from './pushRegistrationService';

let activeController = null;

export const createPushLifecycleController = (overrides = {}) => createCoreController({
    getPermissionState: () => getPushPermissionState(),
    requestPermission: () => requestPushPermission(),
    ensureAndroidChannels: () => ensureAndroidNotificationChannels(),
    resolveProjectId: () => resolveEasProjectId(),
    getExpoPushToken: (projectId) => getExpoPushToken({ projectId }),
    getInstallationId: () => getOrCreatePushInstallationId(),
    registerInstallation: registerPushInstallation,
    addPushTokenListener: typeof Notifications.addPushTokenListener === 'function'
        ? (listener) => Notifications.addPushTokenListener(listener)
        : null,
    appState: AppState,
    getPlatform: () => Platform.OS,
    getAppInfo: () => getPushAppInfo({ constants: Constants, platform: Platform.OS }),
    ...overrides,
});

export const setActivePushLifecycleController = (controller) => {
    activeController = controller;
    return () => {
        if (activeController === controller) activeController = null;
    };
};

export const enablePushNotifications = (options) => (
    activeController?.enablePushNotifications(options)
        || Promise.resolve({ status: 'unauthenticated' })
);

export const getActivePushLifecycleController = () => activeController;
