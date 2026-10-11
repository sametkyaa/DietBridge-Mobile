import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LegalLinks from '../../../shared/components/legal/LegalLinks';
import { colors, spacing, typography } from '../../../shared/theme';

function AcceptanceCheckbox({ label, checked, onChange, disabled }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View style={[styles.box, checked && styles.checked]}>
        <Text style={styles.mark}>{checked ? '✓' : ''}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export default function LegalAcceptanceFields({
  termsAccepted, kvkkAcknowledged, onTermsChange, onKvkkChange, disabled = false,
}) {
  return (
    <View style={styles.root}>
      <LegalLinks includeKvkk />
      <AcceptanceCheckbox
        label="Kullanım Koşulları’nı okudum ve kabul ediyorum."
        checked={termsAccepted}
        onChange={onTermsChange}
        disabled={disabled}
      />
      <AcceptanceCheckbox
        label="KVKK Aydınlatma Metni’ni okudum ve bilgilendirildim."
        checked={kvkkAcknowledged}
        onChange={onKvkkChange}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.x2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, minHeight: 44 },
  box: { width: 24, height: 24, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  mark: { color: colors.white, fontSize: 16 },
  label: { ...typography.supporting, flex: 1, color: colors.textSecondary },
});
