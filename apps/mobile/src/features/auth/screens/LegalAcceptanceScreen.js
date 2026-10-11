import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AuthShell from '../components/AuthShell';
import LegalAcceptanceFields from '../components/LegalAcceptanceFields';
import { useLegalAcceptanceViewModel } from '../viewmodels/useLegalAcceptanceViewModel';
import { AppButton } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

export default function LegalAcceptanceScreen({ onAccepted }) {
  const vm = useLegalAcceptanceViewModel(onAccepted);
  return (
    <AuthShell>
      <View style={styles.root}>
        <Text accessibilityRole="header" style={styles.title}>Yasal bilgilendirme</Text>
        <Text style={styles.description}>Devam etmeden önce aşağıdaki metinleri inceleyin.</Text>
        <LegalAcceptanceFields
          termsAccepted={vm.termsAccepted}
          kvkkAcknowledged={vm.kvkkAcknowledged}
          onTermsChange={vm.setTermsAccepted}
          onKvkkChange={vm.setKvkkAcknowledged}
          disabled={vm.loading}
        />
        {vm.error ? <Text accessibilityRole="alert" style={styles.error}>{vm.error}</Text> : null}
        <AppButton
          label="Kaydet ve devam et"
          onPress={vm.submit}
          loading={vm.loading}
          disabled={!vm.termsAccepted || !vm.kvkkAcknowledged}
        />
        <AppButton label="Çıkış yap" variant="text" onPress={vm.logout} disabled={vm.loading} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.x5 },
  title: { ...typography.display, color: colors.textPrimary },
  description: { ...typography.body, color: colors.textSecondary },
  error: { ...typography.supporting, color: colors.errorDark },
});
