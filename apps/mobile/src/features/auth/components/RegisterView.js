import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput } from '../../../shared/components/ui';
import LegalLinks from '../../../shared/components/legal/LegalLinks';
import { FadeUp } from '../../../shared/components/motion';
import { colors, spacing, typography } from '../../../shared/theme';
import PasswordToggle from './PasswordToggle';
import BrandMark from './BrandMark';
import LegalConsentCheckbox from './LegalConsentCheckbox';
import { KVKK_URL, TERMS_URL } from '../../../shared/utils/externalLinkPolicy.cjs';

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
  termsAccepted,
  kvkkAccepted,
  onToggleTerms,
  onToggleKvkk,
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
      <FadeUp index={0}>
        <BrandMark />
        <Text accessibilityRole="header" style={styles.title}>Hesap oluştur</Text>
        <Text style={styles.subtitle}>
          Birkaç bilgiyle başla; sağlık detaylarını profilinden tamamlayabilirsin.
        </Text>
      </FadeUp>

      <FadeUp index={1}>
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
          <View style={styles.consents}>
            <LegalConsentCheckbox
              checked={!!termsAccepted}
              onToggle={onToggleTerms}
              disabled={loading}
              documentLabel="Kullanım Koşulları"
              documentUrl={TERMS_URL}
              suffix="'nı okudum ve kabul ediyorum."
            />
            <LegalConsentCheckbox
              checked={!!kvkkAccepted}
              onToggle={onToggleKvkk}
              disabled={loading}
              documentLabel="KVKK Aydınlatma Metni"
              documentUrl={KVKK_URL}
              suffix="'ni okudum, kişisel verilerimin işlenmesini kabul ediyorum."
            />
          </View>
        </View>
      </FadeUp>

      <View style={styles.spacer} />
      <FadeUp index={2}>
        <AppButton
          label={loading ? 'Hesap oluşturuluyor…' : 'Kayıt ol'}
          loading={loading}
          onPress={onSubmit}
        />
        <View style={styles.legal}>
          <LegalLinks includeKvkk />
        </View>
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
      </FadeUp>
    </>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.textPrimary, marginTop: spacing.x8 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.x2, maxWidth: 340 },
  form: { gap: spacing.x4, marginTop: spacing.x6 },
  consents: { gap: spacing.x3, marginTop: spacing.x1 },
  spacer: { flex: 1, minHeight: spacing.x6 },
  legal: { marginTop: spacing.x4 },
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
