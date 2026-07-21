import React, { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';

const sharedOpacity = new Animated.Value(1);
let sharedLoop = null;
let sharedSubscriberCount = 0;

function useAnimatedOpacity(enabled, externalValue) {

  useEffect(() => {
    if (!enabled || externalValue) return undefined;

    sharedSubscriberCount += 1;
    if (!sharedLoop) {
      sharedLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sharedOpacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(sharedOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      sharedLoop.start();
    }

    return () => {
      sharedSubscriberCount -= 1;
      if (sharedSubscriberCount === 0 && sharedLoop) {
        sharedLoop.stop();
        sharedLoop = null;
        sharedOpacity.setValue(1);
      }
    };
  }, [enabled, externalValue]);

  return externalValue || sharedOpacity;
}

export function AppSkeleton({
  width = '100%',
  height = 14,
  borderRadius = radius.small,
  lines = 0,
  animated = false,
  animatedValue,
  style,
}) {
  const opacity = useAnimatedOpacity(animated, animatedValue);
  const effectiveOpacity = animated || animatedValue ? opacity : 1;

  if (lines > 1) {
    return (
      <View style={styles.linesWrap}>
        {[...Array(lines)].map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.block,
              {
                width: index === lines - 1 ? '70%' : width,
                height,
                borderRadius,
                opacity: effectiveOpacity,
              },
              style,
            ]}
          />
        ))}
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius, opacity: effectiveOpacity }, style]}
    />
  );
}

export function SkeletonCard({ animated = false, animatedValue, style }) {
  const sharedOpacity = useAnimatedOpacity(animated, animatedValue);
  const value = animated || animatedValue ? sharedOpacity : undefined;

  return (
    <View style={[styles.card, style]}>
      <AppSkeleton width={96} height={12} animatedValue={value} />
      <AppSkeleton height={16} animatedValue={value} style={styles.gap} />
      <AppSkeleton lines={2} height={12} animatedValue={value} style={styles.gap} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceMuted },
  linesWrap: { gap: spacing.x2 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: spacing.x4,
    gap: spacing.x3,
  },
  gap: { marginTop: spacing.x1 },
});

export default AppSkeleton;
