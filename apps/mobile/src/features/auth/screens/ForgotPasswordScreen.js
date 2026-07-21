import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { AuthShell } from '../components';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';

export default function ForgotPasswordScreen({ navigation }) {
  const {
    email,
    setEmail,
    loading,
    errorMessage,
    successMessage,
    handleSubmit,
  } = useForgotPasswordViewModel();

  const handleBackToLogin = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Login');
  };

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

      <Text accessibilityRole="header" style={styles.title}>Şifreni sıfırla</Text>
      <Text style={styles.subtitle}>
        Hesabına bağlı e-posta adresini gir. Sana bir sıfırlama bağlantısı gönderelim.
      </Text>

      <AppInput
        label="E-posta"
        value={email}
        onChangeText={setEmail}
        error={errorMessage}
        editable={!loading}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={handleSubmit}
        style={styles.field}
      />

      {successMessage ? (
        <InlineAlert
          variant="success"
          title="Bağlantı gönderildi"
          message={successMessage}
          style={styles.successAlert}
        />
      ) : null}

      <View style={styles.spacer} />
      <AppButton
        label={loading ? 'Gönderiliyor…' : 'Bağlantı gönder'}
        loading={loading}
        onPress={handleSubmit}
      />
      <View style={styles.footer}>
        <Text style={styles.footerText}>Şifreni hatırladın mı?</Text>
        <Pressable
          onPress={handleBackToLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Giriş ekranına dön"
          accessibilityState={{ disabled: loading }}
          style={({ pressed }) => [styles.footerLink, pressed && !loading && styles.pressed]}
        >
          <Text style={styles.linkText}>Girişe dön</Text>
        </Pressable>
      </View>
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
  field: { marginTop: spacing.x8 },
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
  linkText: { ...typography.supporting, fontWeight: '600', color: colors.primaryDark },
  successAlert: { marginTop: spacing.x4 },
  pressed: { opacity: 0.6 },
});
