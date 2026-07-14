import { useState } from 'react';
import { sendPasswordResetEmail } from '../services/authService';

const SUCCESS_MESSAGE =
    'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Maildeki bağlantıdan yeni şifrenizi belirleyebilirsiniz.';
const GENERIC_ERROR_MESSAGE = 'Bir hata oluştu. Lütfen tekrar deneyin.';
const INVALID_EMAIL_MESSAGE = 'Lütfen geçerli bir e-posta adresi girin.';
const EMPTY_EMAIL_MESSAGE = 'Lütfen e-posta adresinizi girin.';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useForgotPasswordViewModel = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isEmailFocused, setIsEmailFocused] = useState(false);

    const handleEmailChange = (value) => {
        setEmail(value);
        if (errorMessage) {
            setErrorMessage('');
        }
        if (successMessage) {
            setSuccessMessage('');
        }
    };

    const handleSubmit = async () => {
        const cleanEmail = email.trim();
        setErrorMessage('');
        setSuccessMessage('');

        if (!cleanEmail) {
            setErrorMessage(EMPTY_EMAIL_MESSAGE);
            return;
        }

        if (!EMAIL_PATTERN.test(cleanEmail)) {
            setErrorMessage(INVALID_EMAIL_MESSAGE);
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(cleanEmail);
            setSuccessMessage(SUCCESS_MESSAGE);
        } catch (error) {
            console.warn('Password reset email error:', error?.message);
            setErrorMessage(GENERIC_ERROR_MESSAGE);
        } finally {
            setLoading(false);
        }
    };

    return {
        email,
        setEmail: handleEmailChange,
        loading,
        errorMessage,
        successMessage,
        isEmailFocused,
        setIsEmailFocused,
        handleSubmit,
    };
};
