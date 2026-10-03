import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export function SegmentedTabs({ tabs, selectedKey, onChange, style }) {
  const reduced = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;
  const positioned = useRef(false);

  const selectedIndex = Math.max(0, tabs.findIndex((tab) => tab.key === selectedKey));
  const tabWidth = trackWidth > 0 && tabs.length > 0 ? (trackWidth - spacing.x1 * 2) / tabs.length : 0;

  useEffect(() => {
    if (!tabWidth) return;
    const toValue = selectedIndex * tabWidth;
    if (!positioned.current || reduced) {
      positioned.current = true;
      offset.setValue(toValue);
      return;
    }
    Animated.spring(offset, {
      toValue,
      speed: 18,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [offset, reduced, selectedIndex, tabWidth]);

  return (
    <View
      style={[styles.track, style]}
      accessibilityRole="tablist"
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
    >
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.indicator, { width: tabWidth, transform: [{ translateX: offset }] }]}
        />
      ) : null}
      {tabs.map((tab) => {
        const selected = tab.key === selectedKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.tab,
              selected && !tabWidth && styles.selected,
              pressed && !selected && styles.pressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.round, padding: spacing.x1 },
  indicator: {
    position: 'absolute',
    top: spacing.x1,
    bottom: spacing.x1,
    left: spacing.x1,
    borderRadius: radius.round,
    backgroundColor: colors.primaryDark,
  },
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.round },
  selected: { backgroundColor: colors.primaryDark },
  label: { ...typography.supporting, fontFamily: typography.bodyMedium.fontFamily, color: colors.textSecondary },
  labelSelected: { color: colors.textOnPrimary, fontFamily: typography.button.fontFamily },
  pressed: { opacity: 0.7 },
});

export default SegmentedTabs;
