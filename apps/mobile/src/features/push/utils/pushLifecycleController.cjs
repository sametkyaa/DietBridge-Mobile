'use strict';

const {
    PUSH_CAPABILITY_STATUS,
    buildRegistrationKey,
    isUuid,
    normalizeExpoPushToken,
} = require('./pushClientPolicy.cjs');

const getSessionUserId = (session) => (
    typeof session?.user?.id === 'string' && session.user.id.length > 0
        ? session.user.id
        : null
);

const normalizeProjectResult = (result) => {
    if (typeof result === 'string') return { ok: true, projectId: result };
    return result || { ok: false, status: PUSH_CAPABILITY_STATUS.CONFIGURATION_MISSING };
};

const normalizeTokenValue = (value) => (
    typeof value === 'string' ? value : value?.data
);

const createPushLifecycleController = ({
    getPermissionState,
    requestPermission,
    ensureAndroidChannels,
    resolveProjectId,
    getExpoPushToken,
    getInstallationId,
    registerInstallation,
    addPushTokenListener,
    appState,
    getPlatform,
    getAppInfo = () => ({}),
} = {}) => {
    let currentSession = null;
    let sessionVersion = 0;
    let lastRegistrationKey = null;
    let reconcilePromise = null;
    let tokenSubscription = null;
    let appStateSubscription = null;
    let previousAppState = appState?.currentState || 'active';
    let disposed = false;

    const removeTokenListener = () => {
        tokenSubscription?.remove?.();
        tokenSubscription = null;
    };

    const isCurrentSession = (version, userId) => (
        !disposed
        && version === sessionVersion
        && getSessionUserId(currentSession) === userId
    );

    const attachTokenListener = () => {
        if (tokenSubscription || typeof addPushTokenListener !== 'function') return;

        tokenSubscription = addPushTokenListener((nextToken) => {
            const token = normalizeTokenValue(nextToken);
            if (!token || !getSessionUserId(currentSession)) return;
            void reconcile({ tokenOverride: token, reason: 'token_change' });
        });
    };

    const runReconcile = async ({ allowPrompt = false, preflightChannels = false, tokenOverride = null } = {}) => {
        const userId = getSessionUserId(currentSession);
        const version = sessionVersion;
        if (!userId) return { status: PUSH_CAPABILITY_STATUS.UNAUTHENTICATED };

        try {
            if (preflightChannels) await ensureAndroidChannels();

            let permission = await getPermissionState();
            if (permission?.status === PUSH_CAPABILITY_STATUS.UNSUPPORTED_RUNTIME) return permission;

            if (permission?.status === PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED) {
                if (!allowPrompt) return permission;
                permission = await requestPermission();
            }

            if (!permission || permission.status !== PUSH_CAPABILITY_STATUS.PERMISSION_GRANTED) {
                return permission || { status: PUSH_CAPABILITY_STATUS.PERMISSION_DENIED };
            }

            if (!isCurrentSession(version, userId)) {
                return { status: PUSH_CAPABILITY_STATUS.SESSION_CHANGED };
            }

            await ensureAndroidChannels();

            const projectResult = normalizeProjectResult(await resolveProjectId());
            if (!projectResult.ok || !isUuid(projectResult.projectId)) {
                return {
                    status: PUSH_CAPABILITY_STATUS.CONFIGURATION_MISSING,
                    code: projectResult.code || 'PROJECT_ID_MISSING',
                };
            }

            const tokenResult = tokenOverride || await getExpoPushToken(projectResult.projectId);
            const expoPushToken = normalizeExpoPushToken(normalizeTokenValue(tokenResult));
            if (!expoPushToken) {
                return { status: PUSH_CAPABILITY_STATUS.TOKEN_UNAVAILABLE };
            }

            const installationId = await getInstallationId();
            if (!isUuid(installationId)) {
                return { status: PUSH_CAPABILITY_STATUS.REGISTRATION_FAILED, code: 'INSTALLATION_ID_INVALID' };
            }

            if (!isCurrentSession(version, userId)) {
                return { status: PUSH_CAPABILITY_STATUS.SESSION_CHANGED };
            }

            const appInfo = getAppInfo() || {};
            const platform = appInfo.platform || getPlatform?.();
            const registrationKey = buildRegistrationKey({
                userId,
                installationId,
                expoPushToken,
                projectId: projectResult.projectId,
                platform,
                appVersion: appInfo.appVersion,
                nativeBuildVersion: appInfo.nativeBuildVersion,
            });

            if (registrationKey === lastRegistrationKey) {
                attachTokenListener();
                return {
                    status: PUSH_CAPABILITY_STATUS.REGISTERED,
                    installationId,
                    projectId: projectResult.projectId,
                    platform,
                    skipped: true,
                };
            }

            const registered = await registerInstallation({
                installationId,
                expoPushToken,
                platform,
                projectId: projectResult.projectId,
                appVersion: appInfo.appVersion || null,
                nativeBuildVersion: appInfo.nativeBuildVersion || null,
            });

            if (!isCurrentSession(version, userId)) {
                return { status: PUSH_CAPABILITY_STATUS.SESSION_CHANGED };
            }

            lastRegistrationKey = registrationKey;
            attachTokenListener();
            return {
                status: PUSH_CAPABILITY_STATUS.REGISTERED,
                installationId,
                projectId: projectResult.projectId,
                platform,
                result: registered,
            };
        } catch (error) {
            return {
                status: error?.code === PUSH_CAPABILITY_STATUS.TOKEN_UNAVAILABLE
                    ? PUSH_CAPABILITY_STATUS.TOKEN_UNAVAILABLE
                    : PUSH_CAPABILITY_STATUS.REGISTRATION_FAILED,
                code: error?.code || 'PUSH_RECONCILIATION_FAILED',
            };
        }
    };

    const reconcile = (options = {}) => {
        if (reconcilePromise) return reconcilePromise;
        const promise = runReconcile(options);
        reconcilePromise = promise;
        promise.finally(() => {
            if (reconcilePromise === promise) reconcilePromise = null;
        }).catch(() => undefined);
        return promise;
    };

    const enablePushNotifications = () => reconcile({ allowPrompt: true, preflightChannels: true });

    const setSession = (nextSession) => {
        const previousUserId = getSessionUserId(currentSession);
        const nextUserId = getSessionUserId(nextSession);
        currentSession = nextSession || null;

        if (previousUserId !== nextUserId) {
            sessionVersion += 1;
            lastRegistrationKey = null;
            removeTokenListener();
        }

        if (!nextUserId) return Promise.resolve({ status: PUSH_CAPABILITY_STATUS.UNAUTHENTICATED });
        return reconcile();
    };

    const handleAppStateChange = (nextAppState) => {
        const wasBackgrounded = previousAppState !== 'active';
        previousAppState = nextAppState;
        if (nextAppState === 'active' && wasBackgrounded && getSessionUserId(currentSession)) {
            void reconcile();
        }
    };

    if (typeof appState?.addEventListener === 'function') {
        appStateSubscription = appState.addEventListener('change', handleAppStateChange);
    }

    return {
        setSession,
        reconcile,
        enablePushNotifications,
        dispose: () => {
            disposed = true;
            sessionVersion += 1;
            removeTokenListener();
            appStateSubscription?.remove?.();
            appStateSubscription = null;
            currentSession = null;
        },
        getLastRegistrationKey: () => lastRegistrationKey,
    };
};

module.exports = {
    createPushLifecycleController,
};
