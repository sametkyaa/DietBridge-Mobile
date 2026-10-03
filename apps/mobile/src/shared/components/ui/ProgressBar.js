import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const TONES = {
  primary: colors.primary,
  teal: colors.teal,
  info: colors.info,
  warning: colors.warning,
  success: colors.success,
  error: colors.error,
};

export function ProgressBar({ value = 0, tone = 'primary', height = 6, style, accessibilityLabel }) {
  const numericValue = Number(value);
  const clamped = Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 0;
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(clamped);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: clamped,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, progress, reduced]);

  const width = progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <Animated.View
        style={[
          styles.fill,
          { width, backgroundColor: TONES[tone] || TONES.primary },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.round,
  },
  fill: { height: '100%', borderRadius: radius.round },
});

export default ProgressBar;
