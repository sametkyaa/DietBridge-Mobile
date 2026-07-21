import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, EmptyState, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

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
                <View style={styles.titleRow}><Icon name="droplet" size={20} color={colors.tealDark} /><Text style={styles.heading} accessibilityRole="header">Su geçmişi</Text></View>
                <View style={styles.summary}><Text style={styles.total}>{total.toFixed(1)} L</Text><Text style={styles.supporting}>7 günlük toplam · günlük ort. {average.toFixed(1)} L</Text></View>
            </View>
            <View style={styles.chart}>
                {history.map((item) => {
                    const amount = Number(item.amount || 0);
                    return (
                        <View key={item.dateKey || item.day} style={styles.day} accessible accessibilityLabel={`${item.day}, ${amount.toFixed(1)} litre`}>
                            <View style={styles.track} importantForAccessibility="no">
                                <View style={[styles.fill, { height: `${(amount / maxAmount) * 100}%` }]} />
                            </View>
                            <Text style={styles.dayLabel}>{item.day}</Text>
                            <Text style={styles.amount}>{amount.toFixed(1)} L</Text>
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
    total: { ...typography.cardTitle, color: colors.textPrimary },
    supporting: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
    chart: { height: 154, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x1, marginTop: spacing.x4 },
    day: { flex: 1, minWidth: 0, alignItems: 'center' },
    track: { width: 18, height: 106, borderRadius: radius.round, backgroundColor: colors.tealSoft, justifyContent: 'flex-end', overflow: 'hidden' },
    fill: { width: '100%', minHeight: 2, borderRadius: radius.round, backgroundColor: colors.teal },
    dayLabel: { ...typography.caption, fontSize: 10, color: colors.textSecondary, marginTop: spacing.x1 },
    amount: { ...typography.caption, fontSize: 9, color: colors.textTertiary, marginTop: 2 },
});

export default WaterHistoryCard;
