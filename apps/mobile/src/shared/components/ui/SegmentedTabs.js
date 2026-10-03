import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export function SegmentedTabs({ tabs, selectedKey, onChange, style }) {
  return (
    <View style={[styles.track, style]} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.key === selectedKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && !selected && styles.pressed]}
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
  tab: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.round },
  selected: { backgroundColor: colors.primaryDark },
  label: { ...typography.supporting, fontFamily: typography.bodyMedium.fontFamily, color: colors.textSecondary },
  labelSelected: { color: colors.textOnPrimary, fontFamily: typography.button.fontFamily },
  pressed: { opacity: 0.7 },
});

export default SegmentedTabs;
