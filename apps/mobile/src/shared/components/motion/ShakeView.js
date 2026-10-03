import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

const OFFSETS = [-6, 6, -4, 4, 0];

// Shakes horizontally whenever `trigger` changes to a truthy value.
export function ShakeView({ trigger, children, style }) {
  const reduced = useReducedMotion();
  const offset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger || reduced) return undefined;
    const animation = Animated.sequence(
      OFFSETS.map((toValue) => Animated.timing(offset, { toValue, duration: 50, useNativeDriver: true })),
    );
    animation.start();
    return () => animation.stop();
  }, [offset, reduced, trigger]);

  return (
    <Animated.View style={[style, { transform: [{ translateX: offset }] }]}>
      {children}
    </Animated.View>
  );
}

export default ShakeView;
