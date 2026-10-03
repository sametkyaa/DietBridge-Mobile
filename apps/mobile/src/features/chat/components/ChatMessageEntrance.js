import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';

// Slides a freshly arrived chat message into place; existing history renders without motion.
export function ChatMessageEntrance({ animate, children }) {
    const reduced = useReducedMotion();
    // Only the value at mount matters; later re-renders of the same row must not cancel the entrance.
    const animateOnMount = useRef(animate).current;
    const skip = !animateOnMount || reduced;
    const progress = useRef(new Animated.Value(skip ? 1 : 0)).current;

    useEffect(() => {
        if (skip) return undefined;
        const animation = Animated.timing(progress, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        });
        animation.start();
        return () => animation.stop();
    }, [progress, skip]);

    const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

    return (
        <Animated.View style={{ opacity: progress, transform: [{ translateY }, { scale }] }}>
            {children}
        </Animated.View>
    );
}

export default ChatMessageEntrance;
