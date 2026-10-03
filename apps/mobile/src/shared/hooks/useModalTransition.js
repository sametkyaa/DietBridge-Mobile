import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

// Keeps a Modal mounted while its content animates in and out.
// `progress` runs 0 -> 1 on open and back to 0 before `mounted` turns false.
export function useModalTransition(visible, { duration = 300, spring = null } = {}) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (!mounted) return undefined;
    if (reduced) {
      progress.setValue(visible ? 1 : 0);
      if (!visible) setMounted(false);
      return undefined;
    }
    const animation = visible
      ? spring
        ? Animated.spring(progress, { toValue: 1, ...spring, useNativeDriver: true })
        : Animated.timing(progress, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      : Animated.timing(progress, { toValue: 0, duration: Math.round(duration * 0.75), easing: Easing.in(Easing.cubic), useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
    // spring is a config literal; only visibility changes should restart the animation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, mounted, reduced]);

  return { mounted, progress };
}

export default useModalTransition;
