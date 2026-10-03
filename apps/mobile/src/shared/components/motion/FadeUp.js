import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Fades children in while sliding them up; `index` staggers siblings.
export function FadeUp({ children, index = 0, delay = 0, distance = 12, duration = 320, style }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay: delay + index * 60,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, index, progress, reduced]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default FadeUp;
