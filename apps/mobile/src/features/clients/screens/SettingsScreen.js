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
    ScreenHeader,
} from '../../../shared/components/ui';
import { AnimatedChevron } from '../../../shared/components/motion';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { animateNextLayout } from '../../../shared/utils/layoutMotion';
import PasswordToggle from '../../auth/components/PasswordToggle';
import { useSettingsViewModel } from '../viewmodels/useSettingsViewModel';

const DELETE_TITLE = 'Hesabı sil';
const DELETE_MESSAGE = 'DietBridge hesabınız ve danışan hesabınıza bağlı veriler kalıcı olarak silinecek. Bu işlem geri alınamaz.';
const LOGOUT_MESSAGE = 'DietBridge hesabından çıkış yapmak istiyor musunuz?';

const SettingsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const vm = useSettingsViewModel();
    const reducedMotion = useReducedMotion();
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
                <ScreenHeader title="Ayarlar" />
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
            <ScreenHeader
                title="Ayarlar"
                onBack={() => navigation.goBack()}
                backLabel="Ayarlar'a geri dön"
                backDisabled={deletionLoading || isDeletionLocked}
            />

            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.x8 }]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {settingsError ? <InlineAlert variant="error" message={settingsError} /> : null}
                {passwordSuccess ? <InlineAlert variant="success" message={passwordSuccess} /> : null}
                {passwordError ? <InlineAlert variant="error" message={passwordError} /> : null}
                {logoutError ? <InlineAlert variant="error" message={logoutError} /> : null}

                <Text style={styles.sectionTitle} accessibilityRole="header">Hesap ve güvenlik</Text>
                <AppCard style={styles.group}>
                    <View style={[styles.row, styles.divider]}>
                        <View style={styles.rowIcon}><Icon name="person" size={18} color={colors.primaryDark} /></View>
                        <Text style={styles.label}>E-posta</Text>
                        <Text selectable style={styles.email} numberOfLines={1}>{email || '—'}</Text>
                    </View>

                    <Pressable
                        onPress={() => {
                            animateNextLayout({ duration: 260, reduced: reducedMotion });
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
                        style={({ pressed }) => [styles.row, pressed && !operationsDisabled && styles.pressed]}
                    >
                        <View style={styles.rowIcon}><Icon name="lock" size={18} color={colors.primaryDark} /></View>
                        <Text style={styles.actionLabel}>Şifreyi değiştir</Text>
                        <AnimatedChevron expanded={passwordExpanded} size={18} color={colors.textTertiary} />
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

                </AppCard>

                <Text style={styles.sectionTitle} accessibilityRole="header">Uygulama</Text>
                <AppCard style={styles.group}>
                    <View style={[styles.row, styles.divider]}>
                        <View style={styles.rowIcon}><Icon name="info" size={18} color={colors.primaryDark} /></View>
                        <Text style={styles.label}>Sürüm</Text>
                        <Text style={styles.value}>{appVersion}</Text>
                    </View>
                    <Pressable
                        onPress={showLogoutConfirmation}
                        disabled={operationsDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Çıkış yap"
                        accessibilityState={{ disabled: operationsDisabled, busy: logoutLoading }}
                        style={({ pressed }) => [styles.row, pressed && !operationsDisabled && styles.pressed]}
                    >
                        <View style={styles.rowIcon}><Icon name="logout" size={18} color={colors.primaryDark} /></View>
                        <Text style={styles.actionLabel}>{logoutLoading ? 'Çıkış yapılıyor…' : 'Çıkış yap'}</Text>
                    </Pressable>
                </AppCard>

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
                    <Text style={styles.destructiveLabel}>Hesabı sil</Text>
                    <Text style={styles.destructiveHint}>Hesabın ve bağlı veriler kalıcı olarak silinir.</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.x5, gap: spacing.x3 },
    loading: { flex: 1, padding: spacing.x5 },
    loadingGap: { marginTop: spacing.x4 },
    loadingText: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.x4 },
    sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginTop: spacing.x3, paddingHorizontal: spacing.x1 },
    group: { paddingVertical: spacing.x1 },
    row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    rowIcon: { width: 32, height: 32, borderRadius: radius.round, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
    label: { ...typography.body, color: colors.textPrimary },
    email: { ...typography.supporting, color: colors.textSecondary, flex: 1, textAlign: 'right' },
    value: { ...typography.numericSmall, fontSize: 15, color: colors.textSecondary, flex: 1, textAlign: 'right' },
    actionLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
    passwordForm: { gap: spacing.x4, paddingTop: spacing.x2, paddingBottom: spacing.x4 },
    deletionStatus: { gap: spacing.x1, marginTop: spacing.x3 },
    destructiveRow: { alignItems: 'center', gap: spacing.x1, marginTop: spacing.x8, paddingVertical: spacing.x3 },
    destructiveLabel: { ...typography.bodyMedium, color: colors.errorDark },
    destructiveHint: { ...typography.caption, color: colors.textTertiary },
    pressed: { opacity: 0.7 },
});

export default SettingsScreen;
