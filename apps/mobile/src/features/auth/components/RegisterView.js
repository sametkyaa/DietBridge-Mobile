import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import PasswordToggle from './PasswordToggle';

export default function RegisterView({
  fullName,
  phone,
  email,
  password,
  confirmPassword,
  isPasswordVisible,
  isConfirmPasswordVisible,
  loading,
  onFullNameChange,
  onPhoneChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
  onLogin,
}) {
  const passwordToggle = (
    <PasswordToggle
      visible={isPasswordVisible}
      onPress={onTogglePassword}
      disabled={loading}
    />
  );

  return (
    <>
      <Text accessibilityRole="header" style={styles.title}>Hesap oluştur</Text>
      <Text style={styles.subtitle}>
        Birkaç bilgiyle başla; sağlık detaylarını profilinden tamamlayabilirsin.
      </Text>

      <View style={styles.form}>
        <AppInput
          label="Ad soyad"
          value={fullName}
          onChangeText={onFullNameChange}
          editable={!loading}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
        <AppInput
          label="Telefon"
          value={phone}
          onChangeText={onPhoneChange}
          editable={!loading}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          returnKeyType="next"
          placeholder="05xx xxx xx xx"
        />
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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          rightAccessory={passwordToggle}
        />
        <AppInput
          label="Şifre doğrulama"
          value={confirmPassword}
          onChangeText={onConfirmPasswordChange}
          editable={!loading}
          secureTextEntry={!isConfirmPasswordVisible}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={onSubmit}
          placeholder="Şifreni tekrar gir"
          rightAccessory={(
            <PasswordToggle
              visible={isConfirmPasswordVisible}
              onPress={onToggleConfirmPassword}
              disabled={loading}
              label="Şifre doğrulama"
            />
          )}
        />
      </View>

      <View style={styles.spacer} />
      <AppButton
        label={loading ? 'Hesap oluşturuluyor…' : 'Kayıt ol'}
        loading={loading}
        onPress={onSubmit}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Zaten hesabın var mı?</Text>
        <Pressable
          onPress={onLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Giriş yap"
          accessibilityState={{ disabled: loading }}
          style={({ pressed }) => [styles.footerLink, pressed && !loading && styles.pressed]}
        >
          <Text style={styles.linkText}>Giriş yap</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.screenTitle, color: colors.textPrimary },
  subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
  form: { gap: spacing.x4, marginTop: spacing.x6 },
  spacer: { flex: 1, minHeight: spacing.x6 },
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
