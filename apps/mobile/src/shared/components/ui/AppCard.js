import React from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { usePressScale } from '../../hooks/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableCard({ children, style, onPress, accessibilityLabel, contentStyle }) {
  const press = usePressScale({ to: 0.98 });
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, press.animatedStyle, style]}
    >
      <View style={contentStyle}>{children}</View>
    </AnimatedPressable>
  );
}

export function AppCard({ children, style, onPress, accessibilityLabel, contentStyle }) {
  if (onPress) {
    return (
      <PressableCard
        style={style}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        contentStyle={contentStyle}
      >
        {children}
      </PressableCard>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 44,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.x5,
  },
});

export default AppCard;
