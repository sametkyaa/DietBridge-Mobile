import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const parse = (value) => {
    const parsed = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
};

const format = (value, decimals) => (decimals > 0
    ? String(Math.round(value * 10 ** decimals) / 10 ** decimals).replace('.', ',')
    : String(Math.round(value)));

function OnboardingNumberField({ label, value, unit, onChange, step = 1, decimals = 0, min, max, fallback, placeholder }) {
    const adjust = (direction) => {
        const base = parse(value) ?? fallback ?? min ?? 0;
        const nextValue = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, base + direction * step));
        onChange(format(nextValue, decimals));
    };

    return (
        <View style={styles.root}>
            <View style={styles.valueColumn}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.valueRow}>
                    <TextInput
                        value={value}
                        onChangeText={(text) => onChange(text.replace(/[^\d.,]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholder={placeholder}
                        placeholderTextColor={colors.textTertiary}
                        accessibilityLabel={`${label} (${unit})`}
                        maxLength={6}
                        style={styles.input}
                    />
                    <Text style={styles.unit}>{unit}</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <Pressable onPress={() => adjust(-1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${label} azalt`} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
                    <Icon name="minus" size={18} color={colors.primaryDark} />
                </Pressable>
                <Pressable onPress={() => adjust(1)} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${label} artır`} style={({ pressed }) => [styles.stepButton, pressed && styles.pressed]}>
                    <Icon name="plus" size={18} color={colors.primaryDark} />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        paddingHorizontal: spacing.x5,
        paddingVertical: spacing.x4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.x3,
    },
    valueColumn: { flex: 1, minWidth: 0 },
    label: { ...typography.caption, color: colors.textTertiary },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.x1 },
    input: { ...typography.numeric, color: colors.textPrimary, paddingVertical: 0, minWidth: 64 },
    unit: { ...typography.supporting, color: colors.textTertiary },
    actions: { flexDirection: 'row', gap: spacing.x2 },
    stepButton: {
        width: 40,
        height: 40,
        borderRadius: radius.round,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: { opacity: 0.75 },
});

export default OnboardingNumberField;
