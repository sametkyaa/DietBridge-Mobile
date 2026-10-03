import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import Icon from './Icon';

// Stack screens share one header: a round back button on the canvas and a
// large, left-aligned title underneath. No bar, no divider.
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'Geri',
  backDisabled = false,
  right = null,
  style,
}) {
  return (
    <View style={[styles.root, style]}>
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable
            onPress={backDisabled ? undefined : onBack}
            disabled={backDisabled}
            accessibilityRole="button"
            accessibilityLabel={backLabel}
            accessibilityState={{ disabled: backDisabled }}
            hitSlop={4}
            style={({ pressed }) => [styles.back, backDisabled && styles.disabled, pressed && !backDisabled && styles.pressed]}
          >
            <Icon name="back" size={20} color={colors.textPrimary} />
          </Pressable>
        ) : <View style={styles.backPlaceholder} />}
        {right}
      </View>
      {title ? <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.x5, paddingTop: spacing.x2, paddingBottom: spacing.x4 },
  topRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backPlaceholder: { width: 44, height: 44 },
  title: { ...typography.screenTitle, color: colors.textPrimary, marginTop: spacing.x4 },
  subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x1 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});

export default ScreenHeader;
