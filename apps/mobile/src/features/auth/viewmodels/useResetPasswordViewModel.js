import { useState } from 'react';
import { updatePassword } from '../services/authService';

const EMPTY_PASSWORD_MESSAGE = 'Lütfen yeni şifrenizi girin.';
const EMPTY_CONFIRMATION_MESSAGE = 'Lütfen yeni şifrenizi tekrar girin.';
const PASSWORD_MISMATCH_MESSAGE = 'Şifreler eşleşmiyor.';
const GENERIC_ERROR_MESSAGE = 'Şifreniz güncellenemedi. Lütfen tekrar deneyin.';
export const PASSWORD_UPDATED_MESSAGE =
    'Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.';

export const useResetPasswordViewModel = ({ enabled = true, onSuccess } = {}) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

    const handleNewPasswordChange = (value) => {
        setNewPassword(value);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleSubmit = async () => {
        if (!enabled || loading) return;

        setErrorMessage('');
        setSuccessMessage('');

        if (!newPassword) {
            setErrorMessage(EMPTY_PASSWORD_MESSAGE);
            return;
        }

        if (!confirmPassword) {
            setErrorMessage(EMPTY_CONFIRMATION_MESSAGE);
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage(PASSWORD_MISMATCH_MESSAGE);
            return;
        }

        setLoading(true);
        try {
            const result = await updatePassword(newPassword);

            if (!result?.ok) {
                setErrorMessage(result?.message || GENERIC_ERROR_MESSAGE);
                return;
            }

            setSuccessMessage(PASSWORD_UPDATED_MESSAGE);
            await onSuccess?.();
        } catch (_error) {
            setErrorMessage(GENERIC_ERROR_MESSAGE);
        } finally {
            setLoading(false);
        }
    };

    return {
        newPassword,
        setNewPassword: handleNewPasswordChange,
        confirmPassword,
        setConfirmPassword: handleConfirmPasswordChange,
        loading,
        errorMessage,
        successMessage,
        isPasswordVisible,
        togglePasswordVisibility: () => setIsPasswordVisible((currentValue) => !currentValue),
        isConfirmPasswordVisible,
        toggleConfirmPasswordVisibility: () => (
            setIsConfirmPasswordVisible((currentValue) => !currentValue)
        ),
        handleSubmit,
    };
};
