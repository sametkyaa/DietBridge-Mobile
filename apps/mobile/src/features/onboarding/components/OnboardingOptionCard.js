import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const TONES = {
    primary: { background: colors.primarySoft, foreground: colors.primaryDark },
    accent: { background: colors.accentSoft, foreground: colors.accentDark },
    teal: { background: colors.tealSoft, foreground: colors.tealDark },
    error: { background: colors.errorSoft, foreground: colors.errorDark },
};

function OnboardingOptionCard({ label, description, icon = 'target', tone = 'primary', selected = false, onPress }) {
    const palette = TONES[tone] || TONES.primary;
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected, checked: selected }}
            style={({ pressed }) => [styles.root, selected && styles.selected, pressed && styles.pressed]}
        >
            <View style={[styles.iconWrap, { backgroundColor: palette.background }]}>
                <Icon name={icon} size={20} color={palette.foreground} />
            </View>
            <View style={styles.textColumn}>
                <Text style={styles.label}>{label}</Text>
                {description ? <Text style={styles.description}>{description}</Text> : null}
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <Icon name="check" size={13} color={colors.textOnPrimary} /> : null}
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: {
        minHeight: 68,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1.5,
        borderColor: 'transparent',
        paddingHorizontal: spacing.x4,
        paddingVertical: spacing.x3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x3,
    },
    selected: { borderColor: colors.primaryDark, backgroundColor: colors.primarySurface },
    pressed: { opacity: 0.85 },
    iconWrap: { width: 40, height: 40, borderRadius: radius.small, alignItems: 'center', justifyContent: 'center' },
    textColumn: { flex: 1, minWidth: 0 },
    label: { ...typography.bodyMedium, fontFamily: typography.button.fontFamily, color: colors.textPrimary },
    description: { ...typography.supporting, color: colors.textSecondary },
    radio: {
        width: 22,
        height: 22,
        borderRadius: radius.round,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioSelected: { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark },
});

export default OnboardingOptionCard;
