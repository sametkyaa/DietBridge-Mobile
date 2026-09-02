import Constants from 'expo-constants';
import React, { useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    AppButton,
    AppCard,
    AppInput,
    AppSkeleton,
    Icon,
    InlineAlert,
} from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import PasswordToggle from '../../auth/components/PasswordToggle';
import { useSettingsViewModel } from '../viewmodels/useSettingsViewModel';

const DELETE_TITLE = 'Hesabı sil';
const DELETE_MESSAGE = 'DietBridge hesabınız ve danışan hesabınıza bağlı veriler kalıcı olarak silinecek. Bu işlem geri alınamaz.';
const LOGOUT_MESSAGE = 'DietBridge hesabından çıkış yapmak istiyor musunuz?';

const SettingsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const vm = useSettingsViewModel();
    const {
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
    } = vm;

    useEffect(() => navigation.addListener('beforeRemove', (event) => {
        if (!isDeletionLocked && !deletionLoading) return;

        event.preventDefault();
        Alert.alert(
            'Hesap silme işlemi devam ediyor',
            'İşlemi tamamlamak için bu ekranda kalın ve tekrar deneyin.',
            [{ text: 'Tamam', style: 'cancel' }],
        );
    }), [deletionLoading, isDeletionLocked, navigation]);

    const showDeleteConfirmation = () => {
        if (isBusy || isDeletionLocked) return;

        Alert.alert(DELETE_TITLE, DELETE_MESSAGE, [
            { text: 'Vazgeç', style: 'cancel' },
            { text: DELETE_TITLE, style: 'destructive', onPress: confirmAccountDeletion },
        ]);
    };

    const showLogoutConfirmation = () => {
        if (isBusy || isDeletionLocked) return;

        Alert.alert('Çıkış yap', LOGOUT_MESSAGE, [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Çıkış yap', style: 'destructive', onPress: confirmLogout },
        ]);
    };

    const appVersion = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '—';
    const operationsDisabled = loading || isBusy || isDeletionLocked;

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
                <View style={styles.header}>
                    <View style={styles.headerButton} />
                    <Text style={styles.headerTitle}>Ayarlar</Text>
                    <View style={styles.headerButton} />
                </View>
                <View style={styles.loading} accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
                    <AppSkeleton width="55%" height={24} animated />
                    <AppSkeleton height={180} animated style={styles.loadingGap} />
                    <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    disabled={deletionLoading || isDeletionLocked}
                    accessibilityRole="button"
                    accessibilityLabel="Ayarlar'a geri dön"
                    style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
                >
                    <Icon name="back" size={22} color={colors.textPrimary} />
                </Pressable>
                <Text accessibilityRole="header" style={styles.headerTitle}>Ayarlar</Text>
                <View style={styles.headerButton} accessible={false} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.x8 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {settingsError ? <InlineAlert variant="error" message={settingsError} /> : null}
                {passwordSuccess ? <InlineAlert variant="success" message={passwordSuccess} /> : null}
                {passwordError ? <InlineAlert variant="error" message={passwordError} /> : null}
                {logoutError ? <InlineAlert variant="error" message={logoutError} /> : null}

                <AppCard>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Hesap ve güvenlik</Text>
                    <View style={styles.emailRow}>
                        <Text style={styles.label}>E-posta</Text>
                        <Text selectable style={styles.email}>{email || '—'}</Text>
                    </View>

                    <Pressable
                        onPress={() => {
                            setPasswordExpanded((expanded) => !expanded);
                            if (passwordExpanded) {
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordExpanded(false);
                            }
                        }}
                        disabled={operationsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Şifreyi değiştir"
                        accessibilityState={{ disabled: operationsDisabled, expanded: passwordExpanded }}
                        style={({ pressed }) => [styles.actionRow, pressed && !operationsDisabled && styles.pressed]}
                    >
                        <Text style={styles.actionLabel}>Şifreyi değiştir</Text>
                        <Icon name={passwordExpanded ? 'chevronUp' : 'chevronRight'} size={20} color={colors.primaryDark} />
                    </Pressable>

                    {passwordExpanded ? (
                        <View style={styles.passwordForm}>
                            <AppInput
                                label="Mevcut şifre"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                editable={!operationsDisabled}
                                secureTextEntry={!currentPasswordVisible}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="current-password"
                                textContentType="password"
                                rightAccessory={(
                                    <PasswordToggle
                                        label="Mevcut şifre"
                                        visible={currentPasswordVisible}
                                        onPress={() => setCurrentPasswordVisible((visible) => !visible)}
                                        disabled={operationsDisabled}
                                    />
                                )}
                            />
                            <AppInput
                                label="Yeni şifre"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!operationsDisabled}
                                secureTextEntry={!newPasswordVisible}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="new-password"
                                textContentType="newPassword"
                                rightAccessory={(
                                    <PasswordToggle
                                        label="Yeni şifre"
                                        visible={newPasswordVisible}
                                        onPress={() => setNewPasswordVisible((visible) => !visible)}
                                        disabled={operationsDisabled}
                                    />
                                )}
                            />
                            <AppInput
                                label="Yeni şifre tekrar"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!operationsDisabled}
                                secureTextEntry={!confirmPasswordVisible}
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="new-password"
                                textContentType="newPassword"
                                rightAccessory={(
                                    <PasswordToggle
                                        label="Yeni şifre tekrar"
                                        visible={confirmPasswordVisible}
                                        onPress={() => setConfirmPasswordVisible((visible) => !visible)}
                                        disabled={operationsDisabled}
                                    />
                                )}
                            />
                            <AppButton
                                label={passwordChanging ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
                                loading={passwordChanging}
                                disabled={operationsDisabled}
                                onPress={submitPasswordChange}
                            />
                        </View>
                    ) : null}

                    {deletionError ? (
                        <View style={styles.deletionStatus}>
                            <InlineAlert
                                variant={deletionPhase === 'cleanup_failed' ? 'error' : 'warning'}
                                message={deletionError}
                            />
                            <AppButton
                                variant="text"
                                label={deletionPhase === 'cleanup_failed' ? 'Oturumu temizlemeyi tekrar dene' : 'Hesap silme işlemini tekrar dene'}
                                loading={deletionLoading}
                                disabled={isBusy}
                                onPress={deletionPhase === 'cleanup_failed' ? retryLocalCleanup : retryAccountDeletion}
                            />
                        </View>
                    ) : null}

                    <Pressable
                        onPress={showDeleteConfirmation}
                        disabled={operationsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Hesabı sil"
                        accessibilityState={{ disabled: operationsDisabled }}
                        style={({ pressed }) => [styles.destructiveRow, pressed && !operationsDisabled && styles.pressed]}
                    >
                        <View style={styles.destructiveTextWrap}>
                            <Text style={styles.destructiveLabel}>Hesabı sil</Text>
                            <Text style={styles.destructiveHint}>Hesabınızı ve bağlı verileri kalıcı olarak silin</Text>
                        </View>
                        <Icon name="chevronRight" size={20} color={colors.errorDark} />
                    </Pressable>
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Uygulama</Text>
                    <View style={styles.emailRow}>
                        <Text style={styles.label}>Sürüm</Text>
                        <Text style={styles.value}>Sürüm {appVersion}</Text>
                    </View>
                </AppCard>

                <AppButton
                    variant="secondary"
                    label={logoutLoading ? 'Çıkış yapılıyor…' : 'Çıkış yap'}
                    loading={logoutLoading}
                    disabled={operationsDisabled}
                    onPress={showLogoutConfirmation}
                    icon={<Icon name="logout" size={18} color={colors.primaryDark} />}
                />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.x3,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
        backgroundColor: colors.surface,
    },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
    content: { paddingHorizontal: spacing.x5, paddingTop: spacing.x4, gap: spacing.x4 },
    loading: { flex: 1, padding: spacing.x5 },
    loadingGap: { marginTop: spacing.x4 },
    loadingText: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.x4 },
    sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary },
    emailRow: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        marginTop: spacing.x3,
        gap: spacing.x3,
    },
    label: { ...typography.bodyMedium, color: colors.textSecondary },
    email: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    value: { ...typography.bodyMedium, color: colors.textPrimary },
    actionRow: {
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        marginTop: spacing.x2,
    },
    actionLabel: { ...typography.bodyMedium, color: colors.primaryDark, flex: 1 },
    passwordForm: { gap: spacing.x4, paddingTop: spacing.x2 },
    deletionStatus: { gap: spacing.x1, marginTop: spacing.x3 },
    destructiveRow: {
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.borderSoft,
        marginTop: spacing.x2,
    },
    destructiveTextWrap: { flex: 1, gap: spacing.x1 },
    destructiveLabel: { ...typography.bodyMedium, color: colors.errorDark },
    destructiveHint: { ...typography.caption, color: colors.textSecondary },
    pressed: { opacity: 0.7 },
});

export default SettingsScreen;
