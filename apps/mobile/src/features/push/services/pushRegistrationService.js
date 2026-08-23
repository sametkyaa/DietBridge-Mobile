import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../../lib/supabaseClient';
import {
    getOrCreatePushInstallationId,
    getStoredPushInstallationId,
} from './pushInstallationId';
import { isUuid, isExpoPushToken } from '../utils/pushClientPolicy.cjs';

export const registerPushInstallation = async ({
    installationId,
    expoPushToken,
    platform,
    projectId,
    appVersion = null,
    nativeBuildVersion = null,
    supabaseClient = supabase,
} = {}) => {
    if (!isUuid(installationId) || !isExpoPushToken(expoPushToken) || !['android', 'ios'].includes(platform) || !isUuid(projectId)) {
        const error = new Error('Push registration input is invalid.');
        error.code = 'registration_failed';
        throw error;
    }

    const { data: { user } = {}, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user?.id) {
        const error = new Error('Push registration requires an authenticated session.');
        error.code = 'unauthenticated';
        throw error;
    }

    const { data, error: rpcError } = await supabaseClient.rpc('register_push_installation', {
        p_installation_id: installationId,
        p_expo_push_token: expoPushToken,
        p_platform: platform,
        p_project_id: projectId,
        p_app_version: appVersion,
        p_native_build_version: nativeBuildVersion,
    });

    if (rpcError) {
        const error = new Error('Push registration failed.');
        error.code = 'registration_failed';
        throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
        installationId: row?.installation_id || installationId,
        platform: row?.platform || platform,
        projectId: row?.project_id || projectId,
        enabled: row?.enabled !== false,
        lastRegisteredAt: row?.last_registered_at || null,
    };
};

export const revokePushInstallation = async ({
    installationId,
    supabaseClient = supabase,
} = {}) => {
    if (!isUuid(installationId)) return { status: 'revoked', skipped: true };

    const { data: { user } = {}, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user?.id) return { status: 'revoked', skipped: true };

    const { error: rpcError } = await supabaseClient.rpc('revoke_push_installation', {
        p_installation_id: installationId,
    });
    if (rpcError) {
        const error = new Error('Push revoke failed.');
        error.code = 'revoke_failed';
        throw error;
    }

    return { status: 'revoked', installationId };
};

const withTimeout = async (promise, timeoutMs) => {
    let timer;
    try {
        return await Promise.race([
            promise,
            new Promise((resolve) => {
                timer = setTimeout(() => resolve({ status: 'revoke_timeout' }), timeoutMs);
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
};

export const revokePushInstallationBestEffort = async ({
    timeoutMs = 2500,
    storage = AsyncStorage,
    supabaseClient = supabase,
} = {}) => {
    try {
        const installationId = await getStoredPushInstallationId({ storage });
        if (!installationId) return { status: 'revoked', skipped: true };
        return await withTimeout(
            revokePushInstallation({ installationId, supabaseClient }),
            timeoutMs,
        );
    } catch {
        return { status: 'revoke_failed' };
    }
};

export const ensurePushInstallationId = () => getOrCreatePushInstallationId();
