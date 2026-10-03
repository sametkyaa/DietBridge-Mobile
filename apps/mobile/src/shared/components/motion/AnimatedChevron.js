import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Icon } from '../ui/Icon';
import { useReducedMotion } from '../../hooks/useReducedMotion';

// A chevron that rotates between its collapsed and expanded angles.
export function AnimatedChevron({ expanded, collapsedName = 'chevronRight', expandedAngle = -90, size = 18, color }) {
  const reduced = useReducedMotion();
  const rotation = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    const toValue = expanded ? 1 : 0;
    if (reduced) {
      rotation.setValue(toValue);
      return undefined;
    }
    const animation = Animated.timing(rotation, {
      toValue,
      duration: 260,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [expanded, reduced, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${expandedAngle}deg`] });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Icon name={collapsedName} size={size} color={color} />
    </Animated.View>
  );
}

export default AnimatedChevron;
