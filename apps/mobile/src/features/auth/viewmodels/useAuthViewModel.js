import { useState } from 'react';
import { Alert } from 'react-native';
import {
    CLIENT_ONLY_ERROR_MESSAGE,
    GENERIC_AUTH_ERROR_MESSAGE,
    LOGIN_FAILED_ERROR_MESSAGE,
    PROFILE_NOT_FOUND_ERROR_MESSAGE,
    signIn,
    signUp,
} from '../services/authService';

const KNOWN_AUTH_MESSAGES = [
    CLIENT_ONLY_ERROR_MESSAGE,
    PROFILE_NOT_FOUND_ERROR_MESSAGE,
    LOGIN_FAILED_ERROR_MESSAGE,
    GENERIC_AUTH_ERROR_MESSAGE,
];

export const useAuthViewModel = () => {
    const [mode, setMode] = useState('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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

    const getDisplayErrorMessage = (error) => {
        if (KNOWN_AUTH_MESSAGES.includes(error?.message)) {
            return error.message;
        }

        return GENERIC_AUTH_ERROR_MESSAGE;
    };

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
            return;
        }

        setLoading(true);
        try {
            if (isSignIn) {
                await signIn(email, password);
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
                await signUp(email, password, fullName, phone);
                Alert.alert('Başarılı', 'Kayıt tamamlandı! Lütfen e-posta adresinizi doğrulayın.');
                setMode('signin');
            }
        } catch (error) {
            Alert.alert('Hata', getDisplayErrorMessage(error));
        } finally {
            setLoading(false);
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
        loading,
        isPasswordVisible,
        togglePasswordVisibility,
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
