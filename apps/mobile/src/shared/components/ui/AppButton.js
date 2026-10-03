import React, { forwardRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { usePressScale } from '../../hooks/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AppButton = forwardRef(function AppButton({
  variant = 'primary',
  label,
  onPress,
  loading = false,
  disabled = false,
  icon = null,
  accessibilityLabel,
  style,
  textStyle,
}, ref) {
  const unavailable = disabled || loading;
  const isText = variant === 'text';
  const press = usePressScale({ disabled: unavailable || isText });

  return (
    <AnimatedPressable
      ref={ref}
      onPress={unavailable ? undefined : onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      hitSlop={isText ? 8 : 0}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        isText && styles.textVariant,
        unavailable && !isText && styles.disabled,
        press.animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primaryDark}
        />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'primary' && styles.labelPrimary,
              variant === 'secondary' && styles.labelSecondary,
              isText && styles.labelText,
              unavailable && styles.labelDisabled,
              textStyle,
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.round,
    paddingHorizontal: spacing.x6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primaryDark },
  secondary: { backgroundColor: colors.primarySoft },
  textVariant: {
    minHeight: 44,
    paddingHorizontal: spacing.x2,
    backgroundColor: 'transparent',
    alignSelf: 'flex-start',
  },
  disabled: { backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
  label: { ...typography.button },
  labelPrimary: { color: colors.textOnPrimary },
  labelSecondary: { color: colors.primaryDark },
  labelText: { color: colors.primaryDark },
  labelDisabled: { color: colors.textTertiary },
});

export default AppButton;
