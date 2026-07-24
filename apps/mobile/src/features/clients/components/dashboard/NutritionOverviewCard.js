import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon, ProgressBar } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const isFiniteValue = (value) => Number.isFinite(value);

export function NutritionOverviewCard({ nutrition }) {
    const formatValue = (consumed, planned, unit) => (
        isFiniteValue(consumed) && isFiniteValue(planned)
            ? `${Math.round(consumed)}/${Math.round(planned)} ${unit}`
            : '—'
    );
    const rows = [
        { key: 'calories', label: 'Kalori', icon: 'meal', unit: 'kcal', tone: 'info' },
        { key: 'protein', label: 'Protein', icon: 'drumstick', unit: 'g', tone: 'primary' },
        { key: 'carbohydrate', label: 'Karbonhidrat', icon: 'wheat', unit: 'g', tone: 'teal' },
        { key: 'fat', label: 'Yağ', icon: 'leaf', unit: 'g', tone: 'warning' },
    ];

    return (
        <AppCard>
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">Günlük makrolar</Text>
                <Text style={styles.note}>Tamamlanan {nutrition.completedCount} öğün</Text>
            </View>
            {!nutrition.hasMacroData ? <Text style={styles.unavailable}>Planlarda makro bilgisi bulunmuyor.</Text> : null}
            <View style={styles.rows}>
                {rows.map((row) => {
                    const consumed = nutrition.consumed[row.key];
                    const planned = nutrition.planned[row.key];
                    const progress = isFiniteValue(consumed) && isFiniteValue(planned) && planned > 0
                        ? Math.max(0, Math.min(consumed / planned, 1))
                        : 0;
                    return (
                        <View key={row.key} style={styles.row}>
                            <View style={[styles.iconWrap, styles[`${row.tone}IconWrap`]]}>
                                <Icon name={row.icon} size={15} color={styles[`${row.tone}Icon`].color} />
                            </View>
                            <Text style={styles.label} numberOfLines={1}>{row.label}</Text>
                            <View style={styles.progressWrap}>
                                <ProgressBar
                                    value={progress * 100}
                                    tone={row.tone}
                                    accessibilityLabel={`${row.label}: ${formatValue(consumed, planned, row.unit)} tüketilen ve planlanan`}
                                />
                            </View>
                            <Text style={styles.value} numberOfLines={1}>{formatValue(consumed, planned, row.unit)}</Text>
                        </View>
                    );
                })}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.x2, marginBottom: spacing.x3 },
    title: { ...typography.bodyMedium, color: colors.textPrimary, flexShrink: 1 },
    note: { ...typography.caption, color: colors.textSecondary, flexShrink: 1, textAlign: 'right' },
    unavailable: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.x2 },
    rows: { gap: spacing.x2 },
    row: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    iconWrap: { width: 28, height: 28, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    infoIconWrap: { backgroundColor: '#EAF2F8' },
    primaryIconWrap: { backgroundColor: colors.primarySoft },
    tealIconWrap: { backgroundColor: colors.tealSoft },
    warningIconWrap: { backgroundColor: colors.warningSoft },
    infoIcon: { color: colors.infoDark },
    primaryIcon: { color: colors.primaryDark },
    tealIcon: { color: colors.tealDark },
    warningIcon: { color: colors.warningDark },
    label: { ...typography.caption, color: colors.textPrimary, width: 76, flexShrink: 1 },
    progressWrap: { flex: 1, minWidth: 24 },
    value: { ...typography.caption, color: colors.textSecondary, width: 82, textAlign: 'right' },
});

export default NutritionOverviewCard;
