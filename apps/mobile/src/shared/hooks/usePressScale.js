import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

// Spring-based press feedback for Animated pressables.
export function usePressScale({ to = 0.97, disabled = false } = {}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = useCallback((value, bounciness) => {
    if (disabled || reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: value,
      speed: 40,
      bounciness,
      useNativeDriver: true,
    }).start();
  }, [disabled, reduced, scale]);

  const onPressIn = useCallback(() => animateTo(to, 0), [animateTo, to]);
  const onPressOut = useCallback(() => animateTo(1, 6), [animateTo]);

  return {
    onPressIn,
    onPressOut,
    animatedStyle: { transform: [{ scale }] },
  };
}

export default usePressScale;
