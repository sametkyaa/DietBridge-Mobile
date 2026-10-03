import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing, typography } from '../../../shared/theme';

// A balanced plate: half vegetables, a quarter protein, a quarter grains.
// The plate is the product's subject, so it doubles as the brand mark.
export function PlateMark({ size = 64 }) {
    const c = size / 2;
    const r = size * 0.4;
    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle cx={c} cy={c} r={c - 1} fill={colors.surface} stroke={colors.borderStrong} strokeWidth={1} />
            <Path d={`M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`} fill={colors.primarySoft} />
            <Path d={`M ${c} ${c} L ${c} ${c - r} A ${r} ${r} 0 0 1 ${c + r} ${c} Z`} fill={colors.accent} />
            <Path d={`M ${c} ${c} L ${c + r} ${c} A ${r} ${r} 0 0 1 ${c} ${c + r} Z`} fill={colors.tealSoft} />
            <Path d={`M ${c} ${c - r} L ${c} ${c + r} M ${c} ${c} L ${c + r} ${c}`} stroke={colors.surface} strokeWidth={size * 0.035} />
        </Svg>
    );
}

export default function BrandMark() {
    return (
        <View style={styles.root} accessible={false} importantForAccessibility="no-hide-descendants">
            <PlateMark size={44} />
            <Text style={styles.wordmark}>DietBridge</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    wordmark: { ...typography.sectionTitle, color: colors.primaryDark, letterSpacing: -0.3 },
});
