'use strict';

const PUSH_CAPABILITY_STATUS = Object.freeze({
    UNSUPPORTED_RUNTIME: 'unsupported_runtime',
    CONFIGURATION_MISSING: 'configuration_missing',
    PERMISSION_NOT_DETERMINED: 'permission_not_determined',
    PERMISSION_DENIED: 'permission_denied',
    PERMISSION_GRANTED: 'permission_granted',
    TOKEN_UNAVAILABLE: 'token_unavailable',
    REGISTRATION_FAILED: 'registration_failed',
    REGISTERED: 'registered',
    REVOKED: 'revoked',
    UNAUTHENTICATED: 'unauthenticated',
    SESSION_CHANGED: 'session_changed',
});

const PUSH_PERMISSION_STATUS = Object.freeze({
    NOT_DETERMINED: PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED,
    DENIED: PUSH_CAPABILITY_STATUS.PERMISSION_DENIED,
    GRANTED: PUSH_CAPABILITY_STATUS.PERMISSION_GRANTED,
});

const PUSH_CHANNEL_IDS = Object.freeze({
    SILENT: 'dietbridge-silent',
    APPOINTMENTS: 'dietbridge-appointments',
});

const IOS_AUTHORIZATION_STATUS = Object.freeze({
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
});

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPO_PUSH_TOKEN_PATTERN = /^Expo(nent)?PushToken\[[^\s]+\]$/;

const isUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value.trim());

const normalizeUuid = (value) => {
    const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return isUuid(normalized) ? normalized : null;
};

const isExpoPushToken = (value) => (
    typeof value === 'string'
    && value.length >= 10
    && value.length <= 512
    && EXPO_PUSH_TOKEN_PATTERN.test(value.trim())
);

const normalizeExpoPushToken = (value) => {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return isExpoPushToken(normalized) ? normalized : null;
};

const resolveEasProjectId = (constants = {}) => {
    const fromExpoConfig = constants?.expoConfig?.extra?.eas?.projectId;
    const fromEasConfig = constants?.easConfig?.projectId;
    const candidate = fromExpoConfig ?? fromEasConfig;
    const normalized = typeof candidate === 'string' ? candidate.trim().toLowerCase() : '';

    if (!normalized) {
        return {
            ok: false,
            status: PUSH_CAPABILITY_STATUS.CONFIGURATION_MISSING,
            code: 'PROJECT_ID_MISSING',
            projectId: null,
        };
    }

    if (!isUuid(normalized)) {
        return {
            ok: false,
            status: PUSH_CAPABILITY_STATUS.CONFIGURATION_MISSING,
            code: 'PROJECT_ID_INVALID',
            projectId: null,
        };
    }

    return {
        ok: true,
        status: PUSH_CAPABILITY_STATUS.PERMISSION_GRANTED,
        code: null,
        projectId: normalized,
    };
};

const normalizePermissionState = ({
    platform,
    isDevice,
    appOwnership,
    permissionResponse,
} = {}) => {
    if (!['android', 'ios'].includes(platform) || isDevice !== true) {
        return {
            status: PUSH_CAPABILITY_STATUS.UNSUPPORTED_RUNTIME,
            canRegister: false,
            platform,
            isDevice: isDevice === true,
        };
    }

    if (platform === 'android' && appOwnership === 'expo') {
        return {
            status: PUSH_CAPABILITY_STATUS.UNSUPPORTED_RUNTIME,
            canRegister: false,
            platform,
            isDevice: true,
            reason: 'expo_go_android',
        };
    }

    const iosStatus = permissionResponse?.ios?.status;
    const topLevelStatus = permissionResponse?.status;
    const grantedByIos = platform === 'ios' && [
        IOS_AUTHORIZATION_STATUS.AUTHORIZED,
        IOS_AUTHORIZATION_STATUS.PROVISIONAL,
        IOS_AUTHORIZATION_STATUS.EPHEMERAL,
    ].includes(iosStatus);

    if (permissionResponse?.granted === true || grantedByIos || topLevelStatus === 'granted') {
        return {
            status: PUSH_CAPABILITY_STATUS.PERMISSION_GRANTED,
            canRegister: true,
            platform,
            isDevice: true,
            iosAuthorizationStatus: iosStatus ?? null,
        };
    }

    if (platform === 'ios' && iosStatus === IOS_AUTHORIZATION_STATUS.NOT_DETERMINED) {
        return {
            status: PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED,
            canRegister: false,
            platform,
            isDevice: true,
            iosAuthorizationStatus: iosStatus,
        };
    }

    if (platform === 'ios' && iosStatus === IOS_AUTHORIZATION_STATUS.DENIED) {
        return {
            status: PUSH_CAPABILITY_STATUS.PERMISSION_DENIED,
            canRegister: false,
            platform,
            isDevice: true,
            iosAuthorizationStatus: iosStatus,
        };
    }

    if (topLevelStatus === 'undetermined') {
        return {
            status: PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED,
            canRegister: false,
            platform,
            isDevice: true,
        };
    }

    if (topLevelStatus === 'denied' || permissionResponse?.canAskAgain === false) {
        return {
            status: PUSH_CAPABILITY_STATUS.PERMISSION_DENIED,
            canRegister: false,
            platform,
            isDevice: true,
            canAskAgain: permissionResponse?.canAskAgain ?? null,
        };
    }

    return {
        status: PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED,
        canRegister: false,
        platform,
        isDevice: true,
    };
};

const getAndroidChannelConfigs = ({ importance = {} } = {}) => ([
    {
        id: PUSH_CHANNEL_IDS.SILENT,
        name: 'DietBridge sessiz bildirimleri',
        importance: importance.LOW ?? 4,
        sound: null,
        showBadge: false,
        enableVibrate: false,
        vibrationPattern: [],
        enableLights: false,
    },
    {
        id: PUSH_CHANNEL_IDS.APPOINTMENTS,
        name: 'DietBridge randevu bildirimleri',
        importance: importance.DEFAULT ?? 5,
        sound: 'default',
        showBadge: false,
        enableVibrate: true,
        vibrationPattern: [0, 250],
        enableLights: true,
    },
]);

const createInstallationIdStore = ({ storage, crypto, key } = {}) => {
    let inFlight = null;

    const getStored = async () => {
        const value = await storage.getItem(key);
        return normalizeUuid(value);
    };

    const getOrCreate = async () => {
        if (inFlight) return inFlight;

        inFlight = (async () => {
            const stored = await getStored();
            if (stored) return stored;

            if (typeof crypto?.randomUUID !== 'function') {
                const error = new Error('Push installation identity is unavailable.');
                error.code = 'INSTALLATION_ID_UNAVAILABLE';
                throw error;
            }

            const generated = normalizeUuid(crypto.randomUUID());
            if (!generated) {
                const error = new Error('Push installation identity was malformed.');
                error.code = 'INSTALLATION_ID_INVALID';
                throw error;
            }

            await storage.setItem(key, generated);
            return generated;
        })();

        try {
            return await inFlight;
        } finally {
            inFlight = null;
        }
    };

    return {
        getStored,
        getOrCreate,
        resetForTests: () => {
            inFlight = null;
        },
    };
};

const buildRegistrationKey = ({
    userId,
    installationId,
    expoPushToken,
    projectId,
    platform,
    appVersion,
    nativeBuildVersion,
} = {}) => JSON.stringify([
    userId || null,
    installationId || null,
    expoPushToken || null,
    projectId || null,
    platform || null,
    appVersion || null,
    nativeBuildVersion || null,
]);

module.exports = {
    PUSH_CAPABILITY_STATUS,
    PUSH_PERMISSION_STATUS,
    PUSH_CHANNEL_IDS,
    IOS_AUTHORIZATION_STATUS,
    isUuid,
    normalizeUuid,
    isExpoPushToken,
    normalizeExpoPushToken,
    resolveEasProjectId,
    normalizePermissionState,
    getAndroidChannelConfigs,
    createInstallationIdStore,
    buildRegistrationKey,
};
