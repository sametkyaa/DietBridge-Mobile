import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// Counts a number up from its previous value; `format` controls the output text.
export function CountUp({ value, duration = 600, format = (n) => String(Math.round(n)), style, ...textProps }) {
  const reduced = useReducedMotion();
  const target = Number.isFinite(Number(value)) ? Number(value) : 0;
  const animated = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(reduced ? target : 0);

  useEffect(() => {
    const id = animated.addListener(({ value: current }) => setDisplay(current));
    return () => animated.removeListener(id);
  }, [animated]);

  useEffect(() => {
    if (reduced) {
      animated.setValue(target);
      setDisplay(target);
      return undefined;
    }
    const animation = Animated.timing(animated, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) setDisplay(target);
    });
    return () => animation.stop();
  }, [animated, duration, reduced, target]);

  return (
    <Text style={style} {...textProps}>
      {format(display)}
    </Text>
  );
}

export default CountUp;
