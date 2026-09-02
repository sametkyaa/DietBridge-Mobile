import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import PasswordToggle from './PasswordToggle';

export default function LoginView({
  email,
  password,
  isPasswordVisible,
  loading,
  onEmailChange,
  onPasswordChange,
  onTogglePassword,
  onSubmit,
  onForgotPassword,
  onRegister,
  pendingAccountDeletion = false,
  accountDeletionSuccessMessage = null,
  accountDeletionCleanupError = null,
  accountDeletionCleanupAvailable = false,
  accountDeletionCleanupLoading = false,
  onRetryAccountDeletionCleanup,
}) {
  return (
    <>
      <View style={styles.brandMark} accessible={false} importantForAccessibility="no">
        <Icon name="sprout" size={26} color={colors.white} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>Tekrar hoş geldin</Text>
      <Text style={styles.subtitle}>Hesabına giriş yap, kaldığın yerden devam et.</Text>

      {pendingAccountDeletion ? (
        <InlineAlert
          variant="warning"
          message="Bekleyen hesap silme işlemini tamamlamak için aynı hesapla giriş yapın."
          style={styles.accountDeletionAlert}
        />
      ) : null}
      {accountDeletionSuccessMessage ? (
        <InlineAlert
          variant="success"
          message={accountDeletionSuccessMessage}
          style={styles.accountDeletionAlert}
        />
      ) : null}
      {accountDeletionCleanupError ? (
        <View style={styles.accountDeletionCleanup}>
          <InlineAlert variant="error" message={accountDeletionCleanupError} />
          {accountDeletionCleanupAvailable ? (
            <AppButton
              variant="text"
              label="Oturumu temizlemeyi tekrar dene"
              loading={accountDeletionCleanupLoading}
              disabled={loading}
              onPress={onRetryAccountDeletionCleanup}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.form}>
        <AppInput
          label="E-posta"
          value={email}
          onChangeText={onEmailChange}
          editable={!loading}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <AppInput
          label="Şifre"
          value={password}
          onChangeText={onPasswordChange}
          editable={!loading}
          secureTextEntry={!isPasswordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          rightAccessory={(
            <PasswordToggle
              visible={isPasswordVisible}
              onPress={onTogglePassword}
              disabled={loading}
            />
          )}
        />
      </View>

      <Pressable
        onPress={onForgotPassword}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Şifremi unuttum"
        accessibilityState={{ disabled: loading }}
        style={({ pressed }) => [styles.forgot, pressed && !loading && styles.pressed]}
      >
        <Text style={styles.linkText}>Şifremi unuttum</Text>
      </Pressable>

      <View style={styles.spacer} />
      <AppButton
        label={loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        loading={loading}
        onPress={onSubmit}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Hesabın yok mu?</Text>
        <Pressable
          onPress={onRegister}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Kayıt ol"
          accessibilityState={{ disabled: loading }}
          style={({ pressed }) => [styles.footerLink, pressed && !loading && styles.pressed]}
        >
          <Text style={styles.linkText}>Kayıt ol</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  brandMark: {
    width: 52,
    height: 52,
    borderRadius: radius.control,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.x5 },
  subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
  form: { gap: spacing.x4, marginTop: spacing.x8 },
  accountDeletionAlert: { marginTop: spacing.x4 },
  accountDeletionCleanup: { gap: spacing.x1, marginTop: spacing.x4 },
  forgot: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.x2 },
  spacer: { flex: 1, minHeight: spacing.x8 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.x4,
    columnGap: spacing.x1,
  },
  footerText: { ...typography.supporting, color: colors.textSecondary },
  footerLink: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.x1 },
  linkText: { ...typography.supporting, fontFamily: typography.button.fontFamily, color: colors.primaryDark },
  pressed: { opacity: 0.6 },
});
