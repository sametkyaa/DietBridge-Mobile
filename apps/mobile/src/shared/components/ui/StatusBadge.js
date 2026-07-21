import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import Icon from './Icon';

const STATUSES = {
  completed: { background: colors.primarySoft, foreground: colors.primaryDark, icon: 'check', label: 'Tamamlandı' },
  upcoming: { background: colors.tealSoft, foreground: colors.tealDark, icon: 'clock', label: 'Sıradaki' },
  waiting: { background: colors.surfaceMuted, foreground: colors.textSecondary, icon: 'hourglass', label: 'Bekliyor' },
  delayed: { background: colors.warningSoft, foreground: colors.warningDark, icon: 'alert', label: 'Gecikti' },
  connected: { background: colors.primarySoft, foreground: colors.primaryDark, icon: 'check', label: 'Bağlı' },
  info: { background: colors.tealSoft, foreground: colors.infoDark, icon: 'info', label: 'Bilgi' },
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
      <Icon name={config.icon} size={11} color={config.foreground} />
      <Text style={[styles.label, { color: config.foreground }]}>{resolvedLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.x1,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: { ...typography.caption, fontSize: 11, fontFamily: typography.button.fontFamily },
});

export default StatusBadge;
