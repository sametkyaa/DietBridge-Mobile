import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, ProgressBar } from '../../../../shared/components/ui';
import { CountUp } from '../../../../shared/components/motion';
import { colors, spacing, typography } from '../../../../shared/theme';

const isFiniteValue = (value) => Number.isFinite(value);

const ROWS = [
    { key: 'calories', label: 'Enerji', unit: 'kcal' },
    { key: 'protein', label: 'Protein', unit: 'g' },
    { key: 'carbohydrate', label: 'Karbonhidrat', unit: 'g' },
    { key: 'fat', label: 'Yağ', unit: 'g' },
];

export function NutritionOverviewCard({ nutrition, totalMeals }) {
    return (
        <AppCard>
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">Bugün</Text>
                <Text style={styles.note}>
                    {Number.isFinite(totalMeals)
                        ? `${nutrition.completedCount}/${totalMeals} öğün tamamlandı`
                        : `${nutrition.completedCount} öğün tamamlandı`}
                </Text>
            </View>
            {!nutrition.hasMacroData ? <Text style={styles.unavailable}>Planlarda makro bilgisi bulunmuyor.</Text> : null}
            <View style={styles.grid}>
                {ROWS.map((row) => {
                    const consumed = nutrition.consumed[row.key];
                    const planned = nutrition.planned[row.key];
                    const hasValues = isFiniteValue(consumed) && isFiniteValue(planned);
                    const progress = hasValues && planned > 0 ? Math.max(0, Math.min(consumed / planned, 1)) : 0;
                    return (
                        <View key={row.key} style={styles.cell}>
                            <Text style={styles.label}>{row.label}</Text>
                            <Text style={styles.value} numberOfLines={1}>
                                {hasValues ? <CountUp value={consumed} /> : '—'}
                                {hasValues ? <Text style={styles.planned}> / {Math.round(planned)} {row.unit}</Text> : null}
                            </Text>
                            <ProgressBar
                                value={progress * 100}
                                height={4}
                                style={styles.bar}
                                accessibilityLabel={`${row.label}: ${hasValues ? `${Math.round(consumed)} / ${Math.round(planned)} ${row.unit}` : 'veri yok'}`}
                            />
                        </View>
                    );
                })}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: spacing.x2, marginBottom: spacing.x4 },
    title: { ...typography.sectionTitle, color: colors.textPrimary },
    note: { ...typography.supporting, color: colors.textSecondary, flexShrink: 1, textAlign: 'right' },
    unavailable: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.x3 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.x5, columnGap: spacing.x5 },
    cell: { width: '46%', flexGrow: 1 },
    label: { ...typography.supporting, color: colors.textSecondary },
    value: { ...typography.numeric, fontSize: 24, lineHeight: 30, color: colors.textPrimary, marginTop: 2 },
    planned: { ...typography.supporting, fontVariant: ['tabular-nums'], letterSpacing: 0, color: colors.textTertiary },
    bar: { marginTop: spacing.x2, backgroundColor: colors.primarySurface },
});

export default NutritionOverviewCard;
