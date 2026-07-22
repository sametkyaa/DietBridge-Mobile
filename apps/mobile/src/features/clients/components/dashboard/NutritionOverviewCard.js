import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

export function NutritionOverviewCard({ nutrition }) {
    const formatValue = (value, unit) => (
        value === null || value === undefined ? '—' : `${Math.round(value)} ${unit}`
    );
    const rows = [
        { key: 'calories', label: 'Kalori', icon: 'meal', value: formatValue(nutrition.planned.calories, 'kcal') },
        { key: 'protein', label: 'Protein', icon: 'drumstick', value: formatValue(nutrition.planned.protein, 'g') },
        { key: 'carbohydrate', label: 'Karbonhidrat', icon: 'wheat', value: formatValue(nutrition.planned.carbohydrate, 'g') },
        { key: 'fat', label: 'Yağ', icon: 'leaf', value: formatValue(nutrition.planned.fat, 'g') },
    ];

    return (
        <AppCard>
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">Günlük beslenme özeti</Text>
                <Text style={styles.note}>
                    {!nutrition.hasMacroData
                        ? 'Makro bilgisi planlarda bulunmuyor'
                        : nutrition.completedCount > 0
                            && nutrition.consumed.calories !== null
                            && nutrition.planned.calories !== null
                        ? `${Math.round(nutrition.consumed.calories)} / ${Math.round(nutrition.planned.calories)} kcal tüketildi`
                        : 'Planlanan günlük değerler'}
                </Text>
            </View>
            <View style={styles.grid}>
                {rows.map((row) => (
                    <View key={row.key} style={styles.item}>
                        <View style={styles.iconWrap}><Icon name={row.icon} size={17} color={colors.primaryDark} /></View>
                        <Text style={styles.value}>{row.value}</Text>
                        <Text style={styles.label}>{row.label}</Text>
                    </View>
                ))}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.x2, marginBottom: spacing.x4 },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    note: { ...typography.caption, color: colors.textSecondary, flexShrink: 1, textAlign: 'right' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.x1 },
    item: { width: '50%', padding: spacing.x1, alignItems: 'center' },
    iconWrap: { width: 34, height: 34, borderRadius: radius.round, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    value: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: spacing.x1 },
    label: { ...typography.caption, color: colors.textSecondary },
});

export default NutritionOverviewCard;
