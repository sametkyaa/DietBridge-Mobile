import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

const TONES = {
  primary: colors.primary,
  teal: colors.teal,
  info: colors.info,
  warning: colors.warning,
  success: colors.success,
  error: colors.error,
};

export function ProgressBar({ value = 0, tone = 'primary', height = 8, style }) {
  const numericValue = Number(value);
  const clamped = Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 0;

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, backgroundColor: TONES[tone] || TONES.primary },
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
