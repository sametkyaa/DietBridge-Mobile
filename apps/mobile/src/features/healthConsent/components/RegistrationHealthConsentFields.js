import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../../shared/theme';
import { REGISTRATION_HEALTH_DOCUMENT } from '../services/registrationHealthConsent.cjs';

function Choice({ label, checked, disabled, onChange }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityLabel={label}
      accessibilityState={{ checked, disabled }} disabled={disabled}
      onPress={() => onChange(!checked)} style={styles.row}>
      <View style={[styles.box, checked && styles.checked]}>
        <Text style={styles.mark}>{checked ? '✓' : ''}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export default function RegistrationHealthConsentFields({ storage, sharing, onStorageChange, onSharingChange, disabled }) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Sağlık verisi tercihlerin</Text>
      <Text style={styles.label}>Bu seçimler KVKK bilgilendirmesinden ayrıdır ve isteğe bağlıdır. Tercihlerini daha sonra Ayarlar’dan değiştirebilirsin. Rıza vermeden hesap oluşturabilir, sağlık bilgisi adımlarını atlayabilirsin.</Text>
      <Choice label={REGISTRATION_HEALTH_DOCUMENT.processingText} checked={storage} disabled={disabled} onChange={onStorageChange} />
      <Choice label={REGISTRATION_HEALTH_DOCUMENT.sharingText} checked={sharing} disabled={disabled || !storage} onChange={onSharingChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.x2, marginTop: spacing.x2 },
  title: { ...typography.bodyMedium, color: colors.textPrimary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, minHeight: 44 },
  box: { width: 24, height: 24, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  mark: { color: colors.white, fontSize: 16 },
  label: { ...typography.supporting, flexShrink: 1, color: colors.textSecondary },
});
