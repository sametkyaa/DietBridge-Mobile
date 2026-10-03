import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../theme';

const STATUSES = {
  completed: { background: colors.primarySoft, foreground: colors.primaryDark, label: 'Tamamlandı' },
  upcoming: { background: colors.tealSoft, foreground: colors.tealDark, label: 'Sıradaki' },
  waiting: { background: colors.surfaceMuted, foreground: colors.textSecondary, label: 'Bekliyor' },
  delayed: { background: colors.warningSoft, foreground: colors.warningDark, label: 'Gecikti' },
  connected: { background: colors.primarySoft, foreground: colors.primaryDark, label: 'Bağlı' },
  info: { background: colors.tealSoft, foreground: colors.infoDark, label: 'Bilgi' },
};

export function StatusBadge({ status = 'info', label, style }) {
  const config = STATUSES[status] || STATUSES.info;
  const resolvedLabel = label || config.label;

  return (
    <View
      style={[styles.badge, { backgroundColor: config.background }, style]}
      accessibilityLabel={resolvedLabel}
      accessibilityRole="text"
    >
      <View style={[styles.dot, { backgroundColor: config.foreground }]} />
      <Text style={[styles.label, { color: config.foreground }]}>{resolvedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...typography.caption, fontSize: 11, fontFamily: typography.button.fontFamily },
});

export default StatusBadge;
