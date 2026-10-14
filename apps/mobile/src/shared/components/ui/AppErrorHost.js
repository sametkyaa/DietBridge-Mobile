import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme';
import { errorPresenter } from '../../utils/errorPresenter.cjs';
import { AppButton } from './AppButton';
import { Icon } from './Icon';

export default function AppErrorHost({ scopeKey }) {
  const [current, setCurrent] = useState(null);
  useEffect(() => {
    errorPresenter.setScope(scopeKey);
    return errorPresenter.subscribe(setCurrent);
  }, [scopeKey]);
  return (
    <Modal visible={Boolean(current)} transparent animationType="fade"
      onRequestClose={() => current && errorPresenter.close(current.id)} statusBarTranslucent>
      <SafeAreaView style={styles.backdrop} edges={['top', 'bottom', 'left', 'right']}>
        {current ? <View style={styles.card} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content} bounces={false}>
            <View style={styles.icon}><Icon name="alert" color={colors.errorDark} size={28} /></View>
            <Text style={styles.title} accessibilityRole="header">{current.title === 'Uyarı' ? 'Bilgini kontrol et' : current.title === 'Hata' || current.title === 'Bilgi' ? 'İşlem tamamlanamadı' : current.title}</Text>
            <Text style={styles.message} accessibilityRole="alert" accessibilityLiveRegion="polite">{current.explanation.message}</Text>
            <View style={styles.code}><Text selectable style={styles.codeText}>Hata kodu: {current.explanation.code}</Text></View>
          </ScrollView>
          <View style={styles.actions}>{current.actions.map((action, index) => (
            <AppButton key={`${current.id}:${index}`} label={action.text || 'Tamam'}
              variant={action.style === 'cancel' ? 'secondary' : action.style === 'destructive' ? 'danger' : 'primary'}
              onPress={() => errorPresenter.close(current.id, index)} />
          ))}</View>
        </View> : null}
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 35, 29, 0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.x5 },
  card: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden' },
  content: { padding: spacing.x5, gap: spacing.x3, alignItems: 'flex-start' },
  icon: { width: 56, height: 56, borderRadius: radius.round, backgroundColor: colors.errorSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.screenTitle, color: colors.textPrimary },
  message: { ...typography.body, color: colors.textSecondary },
  code: { borderRadius: radius.control, paddingHorizontal: spacing.x3, paddingVertical: spacing.x2, backgroundColor: colors.background },
  codeText: { ...typography.caption, color: colors.textSecondary },
  actions: { padding: spacing.x5, paddingTop: 0, gap: spacing.x2 },
});
