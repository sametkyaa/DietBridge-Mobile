import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, EmptyState, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const fmt = (value) => Number(value || 0).toFixed(1).replace('.', ',');

export function WaterHistoryCard({ history, total }) {
    if (history.length === 0) {
        return (
            <AppCard>
                <Text style={styles.heading} accessibilityRole="header">Su geçmişi</Text>
                <EmptyState icon="droplet" title="Su kaydı bulunmuyor" description="Son yedi gündeki kayıtlar burada görünür." />
            </AppCard>
        );
    }
    const maxAmount = Math.max(...history.map((item) => Number(item.amount || 0)), 1);
    const average = total / 7;
    return (
        <AppCard>
            <View style={styles.header}>
                <View style={styles.titleRow}><Icon name="droplet" size={18} color={colors.tealDark} /><Text style={styles.heading} accessibilityRole="header">Su</Text></View>
                <View style={styles.summary}>
                    <Text style={styles.total}>{fmt(average)}<Text style={styles.totalUnit}> L / gün</Text></Text>
                    <Text style={styles.supporting}>Son 7 günde toplam {fmt(total)} L</Text>
                </View>
            </View>
            <View style={styles.chart}>
                {history.map((item) => {
                    const amount = Number(item.amount || 0);
                    return (
                        <View key={item.dateKey || item.day} style={styles.day} accessible accessibilityLabel={`${item.day}, ${amount.toFixed(1)} litre`}>
                            <View style={styles.track} importantForAccessibility="no">
                                <View style={[styles.fill, { height: `${(amount / maxAmount) * 100}%` }]} />
                            </View>
                            <Text style={styles.amount}>{fmt(amount)}</Text>
                            <Text style={styles.dayLabel}>{item.day}</Text>
                        </View>
                    );
                })}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.x3 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    summary: { alignItems: 'flex-end', flex: 1 },
    total: { ...typography.numericSmall, color: colors.textPrimary },
    totalUnit: { ...typography.supporting, color: colors.textTertiary },
    supporting: { ...typography.caption, color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
    chart: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x2, marginTop: spacing.x5 },
    day: { flex: 1, minWidth: 0, alignItems: 'center' },
    track: { width: '100%', maxWidth: 30, height: 96, borderRadius: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.tealSoft, justifyContent: 'flex-end', overflow: 'hidden' },
    fill: { width: '100%', minHeight: 2, borderRadius: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.teal },
    dayLabel: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    amount: { ...typography.caption, fontVariant: ['tabular-nums'], color: colors.textPrimary, marginTop: spacing.x2 },
});

export default WaterHistoryCard;
