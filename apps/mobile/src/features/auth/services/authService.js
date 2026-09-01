import { supabase } from '../../../lib/supabaseClient';
import { revokePushInstallationBestEffort } from '../../push/services/pushRegistrationService';
import { resolvePasswordResetRedirectUrl } from '../utils/passwordResetPolicy.cjs';
import {
    PASSWORD_RECOVERY_INVALID_MESSAGE,
    parsePasswordRecoveryUrl,
} from '../utils/passwordRecoveryContract.cjs';

export const CLIENT_ONLY_ERROR_MESSAGE =
    'Bu uygulama danışan kullanımı içindir. Diyetisyen paneline web uygulamasından giriş yapabilirsiniz.';
export const PROFILE_NOT_FOUND_ERROR_MESSAGE = 'Kullanıcı profili bulunamadı.';
export const LOGIN_FAILED_ERROR_MESSAGE = 'E-posta veya şifre hatalı.';
export const GENERIC_AUTH_ERROR_MESSAGE = 'Bir sorun oluştu. Lütfen tekrar deneyin.';
export const PASSWORD_UPDATE_ERROR_MESSAGE =
    'Şifreniz güncellenemedi. Lütfen yeni bir sıfırlama bağlantısı isteyin.';

let activePasswordRecoveryUserId = null;

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

const safeSignOut = async () => {
    activePasswordRecoveryUserId = null;
    await revokePushInstallationBestEffort();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
        console.warn('Supabase yerel çıkış işlemi tamamlanamadı.');
    }
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
    await safeSignOut();
};

export const sendPasswordResetEmail = async (email) => {
    const redirectUrl = resolvePasswordResetRedirectUrl();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });

    if (error) throw error;
};

export const isPasswordRecoverySessionActive = () => Boolean(activePasswordRecoveryUserId);

export const establishPasswordRecoverySession = async (url) => {
    activePasswordRecoveryUserId = null;
    const parsed = parsePasswordRecoveryUrl(url);

    if (!parsed.ok) {
        return {
            ok: false,
            handled: parsed.code !== 'PASSWORD_RECOVERY_LINK_UNRELATED',
            code: parsed.code,
            message: parsed.message,
        };
    }

    try {
        const { data, error } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
        });
        const session = data?.session;

        if (error || !session?.user?.id) {
            return {
                ok: false,
                handled: true,
                code: 'PASSWORD_RECOVERY_SESSION_REJECTED',
                message: PASSWORD_RECOVERY_INVALID_MESSAGE,
            };
        }

        activePasswordRecoveryUserId = session.user.id;
        return { ok: true, handled: true };
    } catch (_error) {
        return {
            ok: false,
            handled: true,
            code: 'PASSWORD_RECOVERY_SESSION_REJECTED',
            message: PASSWORD_RECOVERY_INVALID_MESSAGE,
        };
    }
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
