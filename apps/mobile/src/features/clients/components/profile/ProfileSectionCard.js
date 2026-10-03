import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

// Section title lives on the canvas; the rows are one grouped card with
// hairline dividers, label on the left and the value on the right.
export function ProfileSectionCard({ title, icon, rows }) {
    return (
        <View>
            <View style={styles.headingRow}>
                {icon ? <Icon name={icon} size={18} color={colors.primary} /> : null}
                <Text style={styles.heading} accessibilityRole="header">{title}</Text>
            </View>
            <AppCard style={styles.card}>
                {rows.map((row, index) => {
                    const isLast = index === rows.length - 1;
                    const content = (
                        <>
                            <Text style={styles.label}>{row.label}</Text>
                            <Text style={[styles.value, !row.value && styles.empty]} numberOfLines={2}>{row.value || 'Ekle'}</Text>
                            {row.onPress ? <Icon name="chevronRight" size={16} color={colors.textTertiary} /> : null}
                        </>
                    );
                    const rowStyle = [styles.row, !isLast && styles.divider];
                    return row.onPress ? (
                        <Pressable
                            key={row.key}
                            onPress={row.onPress}
                            accessibilityRole="button"
                            accessibilityLabel={`${row.label}, ${row.value || 'henüz eklenmedi'}, düzenle`}
                            style={({ pressed }) => [...rowStyle, pressed && styles.pressed]}
                        >{content}</Pressable>
                    ) : <View key={row.key} style={rowStyle}>{content}</View>;
                })}
            </AppCard>
        </View>
    );
}

const styles = StyleSheet.create({
    headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2, marginBottom: spacing.x3, paddingHorizontal: spacing.x1 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    card: { paddingVertical: spacing.x1 },
    row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingVertical: spacing.x3 },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    label: { ...typography.supporting, color: colors.textSecondary, flexShrink: 0, maxWidth: '50%' },
    value: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    empty: { color: colors.primary, fontFamily: typography.body.fontFamily },
    pressed: { opacity: 0.8 },
});

export default ProfileSectionCard;
