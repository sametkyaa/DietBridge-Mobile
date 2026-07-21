import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import AppButton from './AppButton';
import Icon from './Icon';

export function EmptyState({ icon, title, description, actionLabel, onAction, style }) {
  return (
    <View style={[styles.root, style]}>
      {icon ? (
        <View style={styles.iconWrap} accessible={false} importantForAccessibility="no">
          {typeof icon === 'string' ? <Icon name={icon} size={28} color={colors.textTertiary} /> : icon}
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton variant="secondary" label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: spacing.x8,
    paddingHorizontal: spacing.x6,
    gap: spacing.x2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x2,
  },
  title: { ...typography.cardTitle, color: colors.textPrimary, textAlign: 'center' },
  description: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center' },
  action: { marginTop: spacing.x3, alignSelf: 'stretch' },
});

export default EmptyState;
