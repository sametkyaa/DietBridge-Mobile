import { supabase } from '../../../lib/supabaseClient';
import { revokePushInstallationBestEffort } from '../../push/services/pushRegistrationService';
import { resolvePasswordResetRedirectUrl } from '../utils/passwordResetPolicy.cjs';
import {
    PASSWORD_RECOVERY_INVALID_MESSAGE,
    parsePasswordRecoveryUrl,
} from '../utils/passwordRecoveryContract.cjs';
import {
    clearPasswordRecoveryState,
    getPasswordRecoveryState,
    savePasswordRecoveryState,
} from './passwordRecoveryStateStore';

export const CLIENT_ONLY_ERROR_MESSAGE =
    'Bu uygulama danışan kullanımı içindir. Diyetisyen paneline web uygulamasından giriş yapabilirsiniz.';
export const PROFILE_NOT_FOUND_ERROR_MESSAGE = 'Kullanıcı profili bulunamadı.';
export const LOGIN_FAILED_ERROR_MESSAGE = 'E-posta veya şifre hatalı.';
export const GENERIC_AUTH_ERROR_MESSAGE = 'Bir sorun oluştu. Lütfen tekrar deneyin.';
export const PASSWORD_UPDATE_ERROR_MESSAGE =
    'Şifreniz güncellenemedi. Lütfen yeni bir sıfırlama bağlantısı isteyin.';

let activePasswordRecoveryUserId = null;
let passwordRecoveryOperationId = 0;

const createAuthState = ({ session = null, profile = null } = {}) => {
    const user = session?.user || null;
    const role = profile?.role || null;
    const isClient = role === 'client';

    return {
        session,
        user,
        profile,
        role,
        isClient,
    };
};

const isRecoveryOperationCurrent = (operationId) => (
    operationId === passwordRecoveryOperationId
);

const safeSignOut = async ({ operationId = null } = {}) => {
    const cleanupOperationId = operationId === null
        ? ++passwordRecoveryOperationId
        : operationId;

    if (!isRecoveryOperationCurrent(cleanupOperationId)) {
        return { ok: false, stale: true };
    }

    activePasswordRecoveryUserId = null;
    await revokePushInstallationBestEffort();

    if (!isRecoveryOperationCurrent(cleanupOperationId)) {
        return { ok: false, stale: true };
    }

    let signOutError = null;

    try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        signOutError = error;
    } catch (_error) {
        signOutError = true;
    }

    if (!isRecoveryOperationCurrent(cleanupOperationId)) {
        return { ok: false, stale: true };
    }

    let markerResult = { ok: false };
    if (!signOutError && isRecoveryOperationCurrent(cleanupOperationId)) {
        try {
            markerResult = await clearPasswordRecoveryState();
        } catch (_error) {
            markerResult = { ok: false };
        }
    }

    if (!isRecoveryOperationCurrent(cleanupOperationId)) {
        return { ok: false, stale: true };
    }

    if (!markerResult?.ok || signOutError) {
        console.warn('Supabase yerel çıkış işlemi tamamlanamadı.');
    }

    return {
        ok: Boolean(markerResult?.ok && !signOutError),
        markerCleared: Boolean(markerResult?.ok),
        sessionCleared: !signOutError,
    };
};

export const getUserProfile = async (userId) => {
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.warn('Profil bilgisi alınamadı.');
        throw new Error(PROFILE_NOT_FOUND_ERROR_MESSAGE);
    }

    return profile;
};

export const ensureClientSession = async (session) => {
    if (!session?.user?.id) {
        return createAuthState();
    }

    const profile = await getUserProfile(session.user.id);

    if (profile.role !== 'client') {
        await safeSignOut();
        throw new Error(CLIENT_ONLY_ERROR_MESSAGE);
    }

    return createAuthState({ session, profile });
};

export const getCurrentClientAuthState = async () => {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        console.warn('Oturum durumu alınamadı.');
        throw error;
    }

    if (!session) {
        return createAuthState();
    }

    return ensureClientSession(session);
};

export const subscribeToAuthChanges = (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
        setTimeout(() => callback(event, session), 0);
    });
};

export const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        await safeSignOut();
        throw new Error(LOGIN_FAILED_ERROR_MESSAGE);
    }

    if (!data?.session || !data?.user?.id) {
        await safeSignOut();
        throw new Error(GENERIC_AUTH_ERROR_MESSAGE);
    }

    const authState = await ensureClientSession(data.session);
    return {
        ...data,
        profile: authState.profile,
        role: authState.role,
        isClient: authState.isClient,
    };
};

export const signUp = async (email, password, fullName, phone = null) => {
    const cleanFullName = fullName.trim();
    const cleanPhone = phone?.trim() || null;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                account_type: 'client',
                full_name: cleanFullName,
                phone: cleanPhone,
            },
        },
    });
    if (error) throw error;

    return data;
};

export const signOut = async () => {
    return safeSignOut();
};

export const sendPasswordResetEmail = async (email) => {
    const redirectUrl = resolvePasswordResetRedirectUrl();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });

    if (error) throw error;
};

export const isPasswordRecoverySessionActive = () => Boolean(activePasswordRecoveryUserId);

const createRecoveryFailure = (code) => ({
    ok: false,
    handled: true,
    status: 'invalid',
    code,
    message: PASSWORD_RECOVERY_INVALID_MESSAGE,
});

const createStaleRecoveryResult = () => ({
    ok: false,
    handled: true,
    status: 'stale',
    stale: true,
});

export const establishPasswordRecoverySession = async (url) => {
    const operationId = ++passwordRecoveryOperationId;
    activePasswordRecoveryUserId = null;
    const parsed = parsePasswordRecoveryUrl(url);

    if (!parsed.ok) {
        if (parsed.code !== 'PASSWORD_RECOVERY_LINK_UNRELATED') {
            await safeSignOut({ operationId });
        }

        return {
            ok: false,
            handled: parsed.code !== 'PASSWORD_RECOVERY_LINK_UNRELATED',
            status: 'invalid',
            code: parsed.code,
            message: parsed.message,
        };
    }

    if (!isRecoveryOperationCurrent(operationId)) return createStaleRecoveryResult();

    try {
        const { data, error } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
        });
        const session = data?.session;

        if (!isRecoveryOperationCurrent(operationId)) return createStaleRecoveryResult();

        if (error || !session?.user?.id) {
            await safeSignOut({ operationId });
            return createRecoveryFailure('PASSWORD_RECOVERY_SESSION_REJECTED');
        }

        const markerResult = await savePasswordRecoveryState(session.user.id);
        if (!isRecoveryOperationCurrent(operationId)) return createStaleRecoveryResult();

        if (!markerResult?.ok) {
            await safeSignOut({ operationId });
            return createRecoveryFailure('PASSWORD_RECOVERY_STATE_SAVE_FAILED');
        }

        activePasswordRecoveryUserId = session.user.id;
        return { ok: true, handled: true };
    } catch (_error) {
        await safeSignOut({ operationId });
        return createRecoveryFailure('PASSWORD_RECOVERY_SESSION_REJECTED');
    }
};

export const restorePasswordRecoverySession = async () => {
    const operationId = ++passwordRecoveryOperationId;
    activePasswordRecoveryUserId = null;

    let storedState;
    try {
        storedState = await getPasswordRecoveryState({
            isCurrent: () => isRecoveryOperationCurrent(operationId),
        });
    } catch (_error) {
        storedState = { ok: false };
    }

    if (!isRecoveryOperationCurrent(operationId)) return createStaleRecoveryResult();

    if (!storedState?.ok) {
        await safeSignOut({ operationId });
        return createRecoveryFailure('PASSWORD_RECOVERY_STATE_READ_FAILED');
    }

    if (!storedState.state) {
        return { ok: true, status: 'none' };
    }

    let sessionResult;
    try {
        sessionResult = await supabase.auth.getSession();
    } catch (_error) {
        sessionResult = { data: {}, error: true };
    }

    if (!isRecoveryOperationCurrent(operationId)) return createStaleRecoveryResult();

    const session = sessionResult?.data?.session;
    if (sessionResult?.error) {
        await safeSignOut({ operationId });
        return createRecoveryFailure('PASSWORD_RECOVERY_SESSION_READ_FAILED');
    }

    if (!session?.user?.id) {
        await clearPasswordRecoveryState();
        if (!isRecoveryOperationCurrent(operationId)) return createStaleRecoveryResult();
        return createRecoveryFailure('PASSWORD_RECOVERY_SESSION_MISSING');
    }

    if (session.user.id !== storedState.state.userId) {
        await safeSignOut({ operationId });
        return createRecoveryFailure('PASSWORD_RECOVERY_SESSION_MISMATCH');
    }

    activePasswordRecoveryUserId = storedState.state.userId;
    return { ok: true, status: 'active' };
};

export const updatePassword = async (newPassword) => {
    if (typeof newPassword !== 'string' || !newPassword) {
        return {
            ok: false,
            code: 'PASSWORD_RECOVERY_SESSION_INVALID',
            message: PASSWORD_UPDATE_ERROR_MESSAGE,
        };
    }

    try {
        const {
            data: { session } = {},
            error: sessionError,
        } = await supabase.auth.getSession();

        if (
            sessionError
            || !session?.user?.id
            || !activePasswordRecoveryUserId
            || session.user.id !== activePasswordRecoveryUserId
        ) {
            return {
                ok: false,
                code: 'PASSWORD_RECOVERY_SESSION_INVALID',
                message: PASSWORD_RECOVERY_INVALID_MESSAGE,
            };
        }

        const { data, error } = await supabase.auth.updateUser({ password: newPassword });

        if (error || data?.user?.id !== session.user.id) {
            return {
                ok: false,
                code: 'PASSWORD_UPDATE_FAILED',
                message: PASSWORD_UPDATE_ERROR_MESSAGE,
            };
        }

        return { ok: true };
    } catch (_error) {
        return {
            ok: false,
            code: 'PASSWORD_UPDATE_FAILED',
            message: PASSWORD_UPDATE_ERROR_MESSAGE,
        };
    }
};
