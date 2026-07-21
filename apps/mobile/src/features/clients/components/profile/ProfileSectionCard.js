import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

export function ProfileSectionCard({ title, icon, rows }) {
    return (
        <AppCard>
            <View style={styles.headingRow}><Icon name={icon} size={20} color={colors.primaryDark} /><Text style={styles.heading} accessibilityRole="header">{title}</Text></View>
            <View style={styles.rows}>
                {rows.map((row) => {
                    const content = (
                        <>
                            <View style={styles.textWrap}>
                                <Text style={styles.label}>{row.label}</Text>
                                <Text style={[styles.value, !row.value && styles.empty]} numberOfLines={3}>{row.value || 'Henüz eklenmedi'}</Text>
                            </View>
                            {row.onPress ? <Icon name="chevronRight" color={colors.textTertiary} /> : null}
                        </>
                    );
                    return row.onPress ? (
                        <Pressable
                            key={row.key}
                            onPress={row.onPress}
                            accessibilityRole="button"
                            accessibilityLabel={`${row.label}, ${row.value || 'henüz eklenmedi'}, düzenle`}
                            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                        >{content}</Pressable>
                    ) : <View key={row.key} style={styles.row}>{content}</View>;
                })}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    headingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2, marginBottom: spacing.x2 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    rows: { gap: spacing.x1 },
    row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.x2, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingVertical: spacing.x2 },
    textWrap: { flex: 1, minWidth: 0 },
    label: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    empty: { color: colors.textSecondary, fontFamily: typography.body.fontFamily },
    pressed: { opacity: 0.8 },
});

export default ProfileSectionCard;
