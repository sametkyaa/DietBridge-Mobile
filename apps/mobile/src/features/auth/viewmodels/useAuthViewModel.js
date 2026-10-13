import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
    ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE,
    ACCOUNT_DELETION_PENDING_ERROR_MESSAGE,
    ACCOUNT_DELETION_RETRY_MESSAGE,
    ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE,
    ACCOUNT_DELETION_STATE_ERROR_MESSAGE,
    CLIENT_ONLY_ERROR_MESSAGE,
    GENERIC_AUTH_ERROR_MESSAGE,
    LOGIN_FAILED_ERROR_MESSAGE,
    PROFILE_NOT_FOUND_ERROR_MESSAGE,
    getAccountDeletionCleanupState,
    retryLocalAccountDeletionCleanup,
    signIn,
    signUp,
} from '../services/authService';
import { getAccountDeletionState } from '../services/accountDeletionService';
import { ACCOUNT_DELETION_PHASES } from '../services/accountDeletionStateStore';
import { LEGAL_ACCEPTANCE_MESSAGE, assertLegalAcceptance } from '../utils/legalAcceptancePolicy.cjs';
import { EMAIL_NOT_CONFIRMED_MESSAGE } from '../utils/emailConfirmationPolicy.cjs';
import { HEALTH_CONSENT_UI_ENABLED } from '../../healthConsent/services/healthConsentService';

const KNOWN_AUTH_MESSAGES = [
    EMAIL_NOT_CONFIRMED_MESSAGE,
    LEGAL_ACCEPTANCE_MESSAGE,
    CLIENT_ONLY_ERROR_MESSAGE,
    PROFILE_NOT_FOUND_ERROR_MESSAGE,
    LOGIN_FAILED_ERROR_MESSAGE,
    GENERIC_AUTH_ERROR_MESSAGE,
    ACCOUNT_DELETION_PENDING_ERROR_MESSAGE,
    ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE,
    ACCOUNT_DELETION_STATE_ERROR_MESSAGE,
    ACCOUNT_DELETION_RETRY_MESSAGE,
    ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE,
];

export const useAuthViewModel = () => {
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [kvkkAcknowledged, setKvkkAcknowledged] = useState(false);
    const [healthStorageAccepted, setHealthStorageAccepted] = useState(false);
    const [healthSharingAccepted, setHealthSharingAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [hasPendingAccountDeletion, setHasPendingAccountDeletion] = useState(false);
    const [accountDeletionSuccessMessage, setAccountDeletionSuccessMessage] = useState(null);
    const [accountDeletionCleanupError, setAccountDeletionCleanupError] = useState(null);
    const [accountDeletionCleanupAvailable, setAccountDeletionCleanupAvailable] = useState(false);
    const [accountDeletionCleanupLoading, setAccountDeletionCleanupLoading] = useState(false);
    const accountDeletionCleanupLockRef = useRef(false);

    useEffect(() => {
        let mounted = true;

        const loadAccountDeletionState = async () => {
            const [storedState, cleanupState] = await Promise.all([
                getAccountDeletionState(),
                getAccountDeletionCleanupState(),
            ]);

            if (!mounted) return;
            const isRemotePending = storedState?.ok
                && storedState.state?.active
                && storedState.state.phase === ACCOUNT_DELETION_PHASES.REMOTE_PENDING;
            const isLocalCleanupPending = storedState?.ok
                && storedState.state?.active
                && storedState.state.phase === ACCOUNT_DELETION_PHASES.LOCAL_CLEANUP_PENDING;
            const cleanupRetryAvailable = Boolean(isLocalCleanupPending || cleanupState?.retryAvailable);

            setHasPendingAccountDeletion(Boolean(isRemotePending));
            setAccountDeletionCleanupAvailable(cleanupRetryAvailable);
            setAccountDeletionCleanupError(
                cleanupRetryAvailable ? ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE : null,
            );
        };

        loadAccountDeletionState().catch(() => {
            if (mounted) setHasPendingAccountDeletion(false);
        });

        return () => {
            mounted = false;
        };
    }, []);

    // Focus states
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isNameFocused, setIsNameFocused] = useState(false);
    const [isPhoneFocused, setIsPhoneFocused] = useState(false);
    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

    const isSignIn = mode === 'signin';

    const togglePasswordVisibility = () => {
        setIsPasswordVisible((currentValue) => !currentValue);
    };

    const toggleConfirmPasswordVisibility = () => {
        setIsConfirmPasswordVisible((currentValue) => !currentValue);
    };

    const getDisplayErrorMessage = (error) => {
        if (KNOWN_AUTH_MESSAGES.includes(error?.message)) {
            return error.message;
        }

        return GENERIC_AUTH_ERROR_MESSAGE;
    };

    const handleAuth = async () => {
        if (loading) return;
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            if (isSignIn) {
                const result = await signIn(email, password);
                if (result?.accountDeletionCompleted) {
                    setHasPendingAccountDeletion(false);
                    setAccountDeletionCleanupAvailable(false);
                    setAccountDeletionCleanupError(null);
                    setAccountDeletionSuccessMessage('Hesabınız silindi.');
                    setPassword('');
                    Alert.alert('Başarılı', 'Hesabınız silindi.');
                } else if (result?.accountDeletionCleanupFailed) {
                    setAccountDeletionCleanupAvailable(true);
                    setAccountDeletionCleanupError(
                        result.accountDeletionCleanupMessage || ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE,
                    );
                    Alert.alert(
                        'Bilgi',
                        result.accountDeletionCleanupMessage || ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE,
                    );
                }
            } else {
                if (!fullName.trim()) {
                    Alert.alert('Hata', 'Lütfen ad soyad alanını doldurun.');
                    setLoading(false);
                    return;
                }
                if (password !== confirmPassword) {
                    Alert.alert('Hata', 'Şifreler eşleşmiyor.');
                    setLoading(false);
                    return;
                }
                const acceptance = {
                    termsAccepted, kvkkAcknowledged,
                    ...(HEALTH_CONSENT_UI_ENABLED ? {
                        healthConsent: { storage: healthStorageAccepted, sharing: healthSharingAccepted },
                    } : {}),
                };
                assertLegalAcceptance(acceptance);
                await signUp(email, password, fullName, phone, acceptance);
                setTermsAccepted(false);
                setKvkkAcknowledged(false);
                setHealthStorageAccepted(false);
                setHealthSharingAccepted(false);
                Alert.alert('Başarılı', 'Kayıt tamamlandı! Lütfen e-posta adresinizi doğrulayın.');
                setMode('signin');
            }
        } catch (error) {
            Alert.alert('Hata', getDisplayErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    const handleRetryAccountDeletionCleanup = async () => {
        if (loading || accountDeletionCleanupLoading || accountDeletionCleanupLockRef.current) return;

        accountDeletionCleanupLockRef.current = true;
        setAccountDeletionCleanupLoading(true);
        try {
            const result = await retryLocalAccountDeletionCleanup();
            if (result?.ok) {
                setAccountDeletionCleanupAvailable(false);
                setAccountDeletionCleanupError(null);
                setHasPendingAccountDeletion(false);
                setAccountDeletionSuccessMessage('Hesabınız silindi.');
                Alert.alert('Başarılı', 'Hesabınız silindi.');
            } else {
                setAccountDeletionCleanupError(
                    result?.message || ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE,
                );
            }
        } finally {
            accountDeletionCleanupLockRef.current = false;
            setAccountDeletionCleanupLoading(false);
        }
    };

    return {
        mode,
        setMode,
        email,
        setEmail,
        password,
        setPassword,
        fullName,
        setFullName,
        phone,
        setPhone,
        confirmPassword,
        setConfirmPassword,
        termsAccepted,
        setTermsAccepted,
        kvkkAcknowledged,
        setKvkkAcknowledged,
        healthConsentVisible: HEALTH_CONSENT_UI_ENABLED,
        healthStorageAccepted,
        healthSharingAccepted,
        setHealthStorageAccepted: (value) => {
            setHealthStorageAccepted(value);
            if (!value) setHealthSharingAccepted(false);
        },
        setHealthSharingAccepted,
        loading,
        isPasswordVisible,
        togglePasswordVisibility,
        isConfirmPasswordVisible,
        toggleConfirmPasswordVisibility,
        hasPendingAccountDeletion,
        accountDeletionSuccessMessage,
        accountDeletionCleanupError,
        accountDeletionCleanupAvailable,
        accountDeletionCleanupLoading,
        handleRetryAccountDeletionCleanup,
        isEmailFocused,
        setIsEmailFocused,
        isPasswordFocused,
        setIsPasswordFocused,
        isNameFocused,
        setIsNameFocused,
        isPhoneFocused,
        setIsPhoneFocused,
        isConfirmPasswordFocused,
        setIsConfirmPasswordFocused,
        isSignIn,
        handleAuth,
    };
};
