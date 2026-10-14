import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { useHealthConsentViewModel } from '../viewmodels/useHealthConsentViewModel';
import { KVKK_URL } from '../../../shared/utils/externalLinkPolicy.cjs';
import { openExternalLink } from '../../../shared/utils/externalLinking';

function Choice({ label, checked, disabled, onChange }) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={label}
    accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => onChange(!checked)} style={styles.choice}>
    <Text style={styles.check}>{checked ? '☑' : '☐'}</Text><Text style={styles.text}>{label}</Text>
  </Pressable>;
}

export default function HealthConsentPanel({ disabled = false, onSavingChange, requireAcceptance = false, onReadinessChange }) {
  const vm = useHealthConsentViewModel();
  useEffect(() => {
    onSavingChange?.(vm.saving);
    return () => onSavingChange?.(false);
  }, [onSavingChange, vm.saving]);
  const ready = Boolean(vm.state?.enabled && vm.state.updated_at && vm.state.storage_granted && vm.state.sharing_granted
    && vm.storage && vm.sharing && !vm.loading && !vm.saving && !vm.error);
  useEffect(() => {
    onReadinessChange?.(ready);
    return () => onReadinessChange?.(false);
  }, [onReadinessChange, ready]);
  if (!vm.visible || (vm.state && !vm.state.enabled)) return null;
  const busy = disabled || vm.loading || vm.saving;
  return <View style={styles.root}>
    <Text style={styles.title}>Sağlık verisi tercihlerin</Text>
    <Text style={styles.text}>{requireAcceptance
      ? 'Devam etmek için iki sağlık onayını da verip tercihlerini kaydet. Onaylarını daha sonra Ayarlar’dan geri alabilirsin.'
      : 'Bu tercihler KVKK bilgilendirmesinden ayrıdır. Seçimlerini değiştirip kaydederek rızanı verebilir veya geri alabilirsin. Rıza vermeden sağlık bilgisi adımlarını atlayabilirsin.'}</Text>
    <Pressable accessibilityRole="link" onPress={() => openExternalLink(KVKK_URL)} style={styles.link}>
      <Text style={styles.text}>KVKK Aydınlatma Metni</Text>
    </Pressable>
    {vm.loading ? <Text style={styles.text}>Tercihler yükleniyor…</Text> : null}
    {vm.error ? <InlineAlert variant="error" message={vm.error} /> : null}
    {vm.success ? <InlineAlert variant="success" message={vm.success} /> : null}
    {vm.state?.enabled ? <>
      <Choice label={vm.state.processing_text} checked={vm.storage} disabled={busy} onChange={vm.chooseStorage} />
      <Choice label={vm.state.sharing_text} checked={vm.sharing} disabled={busy || !vm.storage} onChange={vm.chooseSharing} />
      <AppButton label="Tercihleri kaydet" onPress={vm.save} disabled={busy || (requireAcceptance && (!vm.storage || !vm.sharing))} loading={vm.saving} />

    </> : !vm.loading ? <AppButton label="Tekrar dene" variant="text" onPress={vm.retry} disabled={disabled} /> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { gap: spacing.x2, paddingVertical: spacing.x3 },
  title: { ...typography.bodyMedium, color: colors.textPrimary },
  text: { ...typography.supporting, color: colors.textSecondary, flexShrink: 1 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, minHeight: 44 },
  check: { fontSize: 24, color: colors.primaryDark },
  link: { minHeight: 44, justifyContent: 'center' },
});
