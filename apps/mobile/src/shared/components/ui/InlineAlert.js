import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import Icon from './Icon';

const VARIANTS = {
  info: { background: colors.tealSoft, foreground: colors.infoDark, icon: 'info' },
  success: { background: colors.primarySoft, foreground: colors.primaryDark, icon: 'check' },
  warning: { background: colors.warningSoft, foreground: colors.warningDark, icon: 'alert' },
  error: { background: colors.errorSoft, foreground: colors.errorDark, icon: 'alert' },
};

export function InlineAlert({ variant = 'info', title, message, onDismiss, style }) {
  const config = VARIANTS[variant] || VARIANTS.info;

  return (
    <View style={[styles.root, { backgroundColor: config.background }, style]} accessibilityRole="alert">
      <View style={styles.iconWrap} accessible={false} importantForAccessibility="no">
        <Icon name={config.icon} size={16} color={config.foreground} />
      </View>
      <View style={styles.textWrap}>
        {title ? <Text style={[styles.title, { color: config.foreground }]}>{title}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
          hitSlop={8}
          style={styles.dismiss}
        >
          <Icon name="close" size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.control,
    padding: spacing.x3,
    gap: spacing.x3,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  textWrap: { flex: 1, gap: 2 },
  title: { ...typography.supporting, fontFamily: typography.button.fontFamily },
  message: { ...typography.supporting, color: colors.textPrimary },
  dismiss: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});

export default InlineAlert;
