import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE,
    ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE,
    ACCOUNT_DELETION_STATE_ERROR_MESSAGE,
    PASSWORD_CHANGE_ERROR_MESSAGE,
    PASSWORD_SAME_MESSAGE,
    changeAuthenticatedPassword,
    completeLocalAccountDeletionCleanup,
    getAccountDeletionCleanupState,
    getCurrentAuthenticatedUser,
    retryLocalAccountDeletionCleanup,
    signOut,
} from '../../auth/services/authService';
import {
    ACCOUNT_DELETION_MESSAGES,
    ACCOUNT_DELETION_OUTCOMES,
    getAccountDeletionState,
    requestAccountDeletion,
} from '../../auth/services/accountDeletionService';
import { ACCOUNT_DELETION_PHASES } from '../../auth/services/accountDeletionStateStore';

const DELETION_PHASES = Object.freeze({
    IDLE: 'idle',
    REMOTE_PENDING: 'remote_pending',
    CLEANUP_FAILED: 'cleanup_failed',
});

const PASSWORD_REQUIRED_MESSAGE = 'Lütfen tüm şifre alanlarını doldurun.';
const PASSWORD_CONFIRMATION_MESSAGE = 'Şifreler eşleşmiyor.';
const SETTINGS_LOAD_ERROR_MESSAGE = 'Ayarlar yüklenemedi. Lütfen tekrar deneyin.';
const LOGOUT_ERROR_MESSAGE = 'Çıkış yapılamadı. Lütfen tekrar deneyin.';

const getDeletionMessage = (result) => (
    result?.message || ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE
);

export const useSettingsViewModel = () => {
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(null);
    const [passwordExpanded, setPasswordExpanded] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [currentPasswordVisible, setCurrentPasswordVisible] = useState(false);
    const [newPasswordVisible, setNewPasswordVisible] = useState(false);
    const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
    const [passwordChanging, setPasswordChanging] = useState(false);
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [deletionPhase, setDeletionPhase] = useState(DELETION_PHASES.IDLE);
    const [deletionError, setDeletionError] = useState(null);
    const [deletionLoading, setDeletionLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [logoutError, setLogoutError] = useState(null);

    const loadGenerationRef = useRef(0);
    const mountedRef = useRef(true);
    const passwordLockRef = useRef(false);
    const deletionLockRef = useRef(false);
    const logoutLockRef = useRef(false);

    const isDeletionLocked = deletionPhase !== DELETION_PHASES.IDLE;
    const isBusy = passwordChanging || deletionLoading || logoutLoading;

    const loadSettings = useCallback(async () => {
        const generation = ++loadGenerationRef.current;
        mountedRef.current = true;
        setLoading(true);
        setSettingsError(null);
        setPasswordError(null);
        setPasswordSuccess(null);
        setPasswordExpanded(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPasswordVisible(false);
        setNewPasswordVisible(false);
        setConfirmPasswordVisible(false);
        setDeletionError(null);
        setLogoutError(null);

        const [authUser, storedState] = await Promise.all([
            getCurrentAuthenticatedUser(),
            getAccountDeletionState(),
        ]);

        if (!mountedRef.current || generation !== loadGenerationRef.current) return;

        if (!authUser?.ok || !authUser.user?.id) {
            setLoading(false);
            setSettingsError(authUser?.message || SETTINGS_LOAD_ERROR_MESSAGE);
            return;
        }

        setEmail(authUser.user.email || '—');
        setUserId(authUser.user.id);

        if (!storedState?.ok) {
            setDeletionPhase(DELETION_PHASES.REMOTE_PENDING);
            setDeletionError(ACCOUNT_DELETION_STATE_ERROR_MESSAGE);
            setLoading(false);
            return;
        }

        if (storedState.state && storedState.state.userId !== authUser.user.id) {
            await signOut();
            if (!mountedRef.current || generation !== loadGenerationRef.current) return;
            setDeletionPhase(DELETION_PHASES.REMOTE_PENDING);
            setDeletionError(ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE);
            setLoading(false);
            return;
        }

        const cleanupState = await getAccountDeletionCleanupState({ userId: authUser.user.id });
        if (!mountedRef.current || generation !== loadGenerationRef.current) return;

        const isLocalCleanupPending = storedState.state?.phase === ACCOUNT_DELETION_PHASES.LOCAL_CLEANUP_PENDING
            || cleanupState?.serverDeleted;
        if (isLocalCleanupPending) {
            setDeletionPhase(DELETION_PHASES.CLEANUP_FAILED);
            setDeletionError(ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE);
        } else if (storedState.state) {
            setDeletionPhase(DELETION_PHASES.REMOTE_PENDING);
            setDeletionError(ACCOUNT_DELETION_MESSAGES.RETRYABLE);
        } else {
            setDeletionPhase(DELETION_PHASES.IDLE);
            setDeletionError(null);
        }

        setLoading(false);
    }, []);

    useFocusEffect(
        useCallback(() => {
            mountedRef.current = true;
            loadSettings().catch(() => {
                if (!mountedRef.current) return;
                setLoading(false);
                setSettingsError(SETTINGS_LOAD_ERROR_MESSAGE);
            });

            return () => {
                mountedRef.current = false;
                loadGenerationRef.current += 1;
            };
        }, [loadSettings]),
    );

    const validatePassword = () => {
        if (!currentPassword || !newPassword || !confirmPassword) return PASSWORD_REQUIRED_MESSAGE;
        if (newPassword !== confirmPassword) return PASSWORD_CONFIRMATION_MESSAGE;
        if (newPassword === currentPassword) return PASSWORD_SAME_MESSAGE;
        return null;
    };

    const submitPasswordChange = async () => {
        if (isBusy || isDeletionLocked || passwordLockRef.current) return;

        const validationError = validatePassword();
        if (validationError) {
            setPasswordError(validationError);
            setPasswordSuccess(null);
            return;
        }

        passwordLockRef.current = true;
        setPasswordChanging(true);
        setPasswordError(null);
        setPasswordSuccess(null);

        try {
            const result = await changeAuthenticatedPassword({ currentPassword, newPassword });
            if (!result?.ok) {
                setPasswordError(result?.message || PASSWORD_CHANGE_ERROR_MESSAGE);
                return;
            }

            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordExpanded(false);
            setPasswordSuccess('Şifreniz güncellendi.');
        } catch (_error) {
            setPasswordError(PASSWORD_CHANGE_ERROR_MESSAGE);
        } finally {
            passwordLockRef.current = false;
            setPasswordChanging(false);
        }
    };

    const performAccountDeletion = useCallback(async () => {
        if (isBusy || deletionLockRef.current || !userId) return null;

        deletionLockRef.current = true;
        setDeletionLoading(true);
        setDeletionError(null);

        try {
            const result = await requestAccountDeletion({ expectedUserId: userId });

            if (result?.outcome === ACCOUNT_DELETION_OUTCOMES.DELETED) {
                const cleanupResult = await completeLocalAccountDeletionCleanup({
                    userId,
                    serverDeletionConfirmed: result.phasePersisted !== true,
                });
                if (cleanupResult?.ok) {
                    setDeletionPhase(DELETION_PHASES.IDLE);
                    setDeletionError(null);
                    return cleanupResult;
                }

                setDeletionPhase(DELETION_PHASES.CLEANUP_FAILED);
                setDeletionError(ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE);
                return cleanupResult;
            }

            if (result?.outcome === ACCOUNT_DELETION_OUTCOMES.LOCAL_CLEANUP_PENDING) {
                setDeletionPhase(DELETION_PHASES.CLEANUP_FAILED);
                setDeletionError(ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE);
                return result;
            }

            if (
                result?.outcome === ACCOUNT_DELETION_OUTCOMES.RETRYABLE
                || result?.outcome === ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE
            ) {
                setDeletionPhase(DELETION_PHASES.REMOTE_PENDING);
            } else {
                setDeletionPhase(DELETION_PHASES.IDLE);
            }
            setDeletionError(getDeletionMessage(result));
            return result;
        } catch (_error) {
            setDeletionPhase(DELETION_PHASES.REMOTE_PENDING);
            setDeletionError(ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE);
            return { ok: false, outcome: ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE };
        } finally {
            deletionLockRef.current = false;
            setDeletionLoading(false);
        }
    }, [isBusy, userId]);

    const confirmAccountDeletion = () => performAccountDeletion();

    const retryAccountDeletion = () => {
        if (deletionPhase !== DELETION_PHASES.REMOTE_PENDING) return null;
        return performAccountDeletion();
    };

    const retryLocalCleanup = async () => {
        if (isBusy || deletionLockRef.current) return null;

        deletionLockRef.current = true;
        setDeletionLoading(true);
        setDeletionError(null);
        try {
            const result = await retryLocalAccountDeletionCleanup();
            if (result?.ok) {
                setDeletionPhase(DELETION_PHASES.IDLE);
                setDeletionError(null);
            } else {
                setDeletionPhase(DELETION_PHASES.CLEANUP_FAILED);
                setDeletionError(ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE);
            }
            return result;
        } finally {
            deletionLockRef.current = false;
            setDeletionLoading(false);
        }
    };

    const confirmLogout = async () => {
        if (isBusy || isDeletionLocked || logoutLockRef.current) return null;

        logoutLockRef.current = true;
        setLogoutLoading(true);
        setLogoutError(null);
        try {
            const result = await signOut();
            if (!result?.ok) {
                setLogoutError(LOGOUT_ERROR_MESSAGE);
            }
            return result;
        } catch (_error) {
            setLogoutError(LOGOUT_ERROR_MESSAGE);
            return { ok: false };
        } finally {
            logoutLockRef.current = false;
            setLogoutLoading(false);
        }
    };

    return {
        email,
        loading,
        settingsError,
        passwordExpanded,
        setPasswordExpanded,
        currentPassword,
        setCurrentPassword,
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        currentPasswordVisible,
        setCurrentPasswordVisible,
        newPasswordVisible,
        setNewPasswordVisible,
        confirmPasswordVisible,
        setConfirmPasswordVisible,
        passwordChanging,
        passwordError,
        passwordSuccess,
        submitPasswordChange,
        deletionPhase,
        deletionError,
        deletionLoading,
        retryAccountDeletion,
        retryLocalCleanup,
        confirmAccountDeletion,
        logoutLoading,
        logoutError,
        confirmLogout,
        isDeletionLocked,
        isBusy,
    };
};

export { DELETION_PHASES };
