import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Tracks the OS "reduce motion" setting so animations can be skipped.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(Boolean(value));
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}

export default useReducedMotion;
