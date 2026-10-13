import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AuthShell from '../components/AuthShell';
import LegalAcceptanceFields from '../components/LegalAcceptanceFields';
import HealthConsentPanel from '../../healthConsent/components/HealthConsentPanel';
import { useLegalAcceptanceViewModel } from '../viewmodels/useLegalAcceptanceViewModel';
import { AppButton } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

export default function LegalAcceptanceScreen({ onAccepted, legalAcceptanceRequired = true, healthConsentNeedsReview = false }) {
  const vm = useLegalAcceptanceViewModel(onAccepted, { legalAcceptanceRequired, healthConsentNeedsReview });
  return (
    <AuthShell>
      <View style={styles.root}>
        <Text accessibilityRole="header" style={styles.title}>Yasal bilgilendirme</Text>
        <Text style={styles.description}>{vm.healthConsentNeedsReview
          ? 'Kayıt sırasında seçtiğin sağlık verisi tercihleri doğrulanamadı veya metin güncellendi. Güncel metinleri inceleyip tercihlerini kaydet. Rıza vermeden de devam edebilirsin.'
          : 'Devam etmeden önce aşağıdaki metinleri inceleyin.'}</Text>
        {vm.legalAcceptanceRequired ? <LegalAcceptanceFields
          termsAccepted={vm.termsAccepted}
          kvkkAcknowledged={vm.kvkkAcknowledged}
          onTermsChange={vm.setTermsAccepted}
          onKvkkChange={vm.setKvkkAcknowledged}
          disabled={vm.loading}
        /> : null}
        {vm.healthConsentNeedsReview ? <HealthConsentPanel disabled={vm.loading} /> : null}
        {vm.error ? <Text accessibilityRole="alert" style={styles.error}>{vm.error}</Text> : null}
        <AppButton
          label={vm.legalAcceptanceRequired ? 'Kaydet ve devam et' : 'Devam et'}
          onPress={vm.submit}
          loading={vm.loading}
          disabled={vm.legalAcceptanceRequired && (!vm.termsAccepted || !vm.kvkkAcknowledged)}
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
