import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Springs children in from a smaller scale; pass animate={false} to show them instantly.
export function PopIn({ children, animate = true, from = 0.6, style }) {
  const reduced = useReducedMotion();
  const skip = !animate || reduced;
  const scale = useRef(new Animated.Value(skip ? 1 : from)).current;

  useEffect(() => {
    if (skip) {
      scale.setValue(1);
      return undefined;
    }
    const animation = Animated.spring(scale, { toValue: 1, speed: 14, bounciness: 10, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scale, skip]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

export default PopIn;
