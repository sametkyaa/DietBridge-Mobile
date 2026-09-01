import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { AuthShell, PasswordToggle } from '../components';
import { PASSWORD_RECOVERY_INVALID_MESSAGE } from '../utils/passwordRecoveryContract.cjs';
import {
    PASSWORD_UPDATED_MESSAGE,
    useResetPasswordViewModel,
} from '../viewmodels/useResetPasswordViewModel';

export default function ResetPasswordScreen({
    navigation,
    recoveryStatus = 'invalid',
    recoveryError = null,
    onRecoverySuccess,
    onRecoveryCancel,
    onRequestAnotherLink,
}) {
    const isReady = recoveryStatus === 'ready';
    const {
        newPassword,
        setNewPassword,
        confirmPassword,
        setConfirmPassword,
        loading,
        errorMessage,
        successMessage,
        isPasswordVisible,
        togglePasswordVisibility,
        isConfirmPasswordVisible,
        toggleConfirmPasswordVisibility,
        handleSubmit,
    } = useResetPasswordViewModel({
        enabled: isReady,
        onSuccess: async () => {
            if (onRecoverySuccess) {
                await onRecoverySuccess();
            } else {
                navigation.navigate('Login');
            }

            Alert.alert('Başarılı', PASSWORD_UPDATED_MESSAGE);
        },
    });

    const handleBackToLogin = () => {
        if (loading) return;

        if (onRecoveryCancel) {
            void onRecoveryCancel();
            return;
        }

        navigation.navigate('Login');
    };

    const handleRequestAnotherLink = () => {
        if (loading) return;

        if (onRequestAnotherLink) {
            void onRequestAnotherLink();
            return;
        }

        navigation.navigate('ForgotPassword');
    };

    if (!isReady) {
        return (
            <AuthShell>
                <Pressable
                    onPress={handleBackToLogin}
                    accessibilityRole="button"
                    accessibilityLabel="Giriş ekranına dön"
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Icon name="back" size={22} color={colors.textPrimary} />
                </Pressable>

                <Text accessibilityRole="header" style={styles.title}>Bağlantı kullanılamıyor</Text>
                <Text style={styles.subtitle}>
                    Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş olabilir.
                </Text>

                <InlineAlert
                    variant="error"
                    title="Şifre sıfırlama başarısız"
                    message={recoveryError || PASSWORD_RECOVERY_INVALID_MESSAGE}
                    style={styles.alert}
                />

                <View style={styles.spacer} />
                <AppButton
                    label="Yeni bağlantı iste"
                    onPress={handleRequestAnotherLink}
                />
                <AppButton
                    variant="text"
                    label="Giriş ekranına dön"
                    onPress={handleBackToLogin}
                    style={styles.secondaryAction}
                />
            </AuthShell>
        );
    }

    return (
        <AuthShell>
            <Pressable
                onPress={handleBackToLogin}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Giriş ekranına dön"
                accessibilityState={{ disabled: loading }}
                style={({ pressed }) => [styles.backButton, pressed && !loading && styles.pressed]}
            >
                <Icon name="back" size={22} color={colors.textPrimary} />
            </Pressable>

            <Text accessibilityRole="header" style={styles.title}>Yeni şifreni belirle</Text>
            <Text style={styles.subtitle}>
                Hesabın için yeni bir şifre oluştur. Şifreni iki kez girerek onayla.
            </Text>

            <View style={styles.form}>
                <AppInput
                    label="Yeni şifre"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    editable={!loading}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    rightAccessory={(
                        <PasswordToggle
                            visible={isPasswordVisible}
                            onPress={togglePasswordVisibility}
                            disabled={loading}
                            label="Yeni şifre"
                        />
                    )}
                />
                <AppInput
                    label="Yeni şifre tekrar"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    error={errorMessage}
                    editable={!loading}
                    secureTextEntry={!isConfirmPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    rightAccessory={(
                        <PasswordToggle
                            visible={isConfirmPasswordVisible}
                            onPress={toggleConfirmPasswordVisibility}
                            disabled={loading}
                            label="Yeni şifre tekrarı"
                        />
                    )}
                />
            </View>

            {successMessage ? (
                <InlineAlert
                    variant="success"
                    title="Şifre güncellendi"
                    message={successMessage}
                    style={styles.alert}
                />
            ) : null}

            <View style={styles.spacer} />
            <AppButton
                label={loading ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
                loading={loading}
                onPress={handleSubmit}
            />
        </AuthShell>
    );
}

const styles = StyleSheet.create({
    backButton: {
        width: 44,
        height: 44,
        borderRadius: radius.control,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.x6 },
    subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
    form: { gap: spacing.x4, marginTop: spacing.x8 },
    alert: { marginTop: spacing.x4 },
    spacer: { flex: 1, minHeight: spacing.x8 },
    secondaryAction: { marginTop: spacing.x2 },
    pressed: { opacity: 0.6 },
});
