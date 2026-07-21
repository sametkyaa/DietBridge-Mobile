import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, EmptyState, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const formatChange = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)} kg`;

export function WeightProgressCard({ data, selectedIndex, onSelect, maxChangeMagnitude, currentWeight, startWeight, weightChange, monthLabel }) {
    if (data.length === 0) {
        return (
            <AppCard>
                <Text style={styles.heading} accessibilityRole="header">Kilo ilerlemesi</Text>
                <EmptyState icon="analytics" title="Kilo geçmişi bulunmuyor" description="Kilo kaydı Dashboard üzerinden eklendiğinde burada görünür." />
            </AppCard>
        );
    }

    const selected = data[Math.min(selectedIndex, data.length - 1)];
    return (
        <AppCard>
            <View style={styles.header}>
                <View>
                    <Text style={styles.heading} accessibilityRole="header">Kilo ilerlemesi</Text>
                    <Text style={styles.supporting}>{monthLabel}</Text>
                </View>
                <View style={styles.currentBlock}>
                    <Text style={styles.current}>{Number(currentWeight).toFixed(1)} kg</Text>
                    <Text style={[styles.change, weightChange > 0 && styles.gain]}>{formatChange(weightChange)}</Text>
                </View>
            </View>
            <View style={styles.selectedSummary} accessibilityLiveRegion="polite">
                <Icon name="analytics" size={18} color={colors.primaryDark} />
                <Text style={styles.selectedText}>{selected.dateLabel}: {Number(selected.weight).toFixed(1)} kg · {selectedIndex === 0 ? 'Başlangıç kaydı' : formatChange(selected.change)}</Text>
            </View>
            {data.length < 2 ? (
                <Text style={styles.supporting}>Grafik için en az iki kilo ölçümü gerekir.</Text>
            ) : (
                <View style={styles.chart}>
                    {data.map((item, index) => {
                        const active = index === selectedIndex;
                        const fillHeight = 12 + (Math.abs(item.change) / maxChangeMagnitude) * 110;
                        const changeLabel = index === 0 ? 'başlangıç kaydı' : `değişim ${formatChange(item.change)}`;
                        return (
                            <Pressable
                                key={`${item.week}-${item.dateLabel}`}
                                onPress={() => onSelect(index)}
                                accessibilityRole="button"
                                accessibilityLabel={`${item.dateLabel}, ${Number(item.weight).toFixed(1)} kilogram, ${changeLabel}`}
                                accessibilityState={{ selected: active }}
                                style={({ pressed }) => [styles.point, pressed && styles.pressed]}
                            >
                                <View style={[styles.track, active && styles.trackActive]} importantForAccessibility="no">
                                    <View style={[styles.fill, { height: fillHeight }, item.change > 0 ? styles.fillGain : styles.fillLoss]} />
                                </View>
                                <Text style={[styles.date, active && styles.dateActive]}>{item.dateLabel}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
            <View style={styles.footer}>
                <View><Text style={styles.caption}>Başlangıç</Text><Text style={styles.footerValue}>{Number(startWeight).toFixed(1)} kg</Text></View>
                <View><Text style={styles.caption}>Güncel</Text><Text style={styles.footerValue}>{Number(currentWeight).toFixed(1)} kg</Text></View>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.x3 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x1 },
    currentBlock: { alignItems: 'flex-end' },
    current: { ...typography.cardTitle, color: colors.textPrimary },
    change: { ...typography.supporting, color: colors.success, marginTop: 2 },
    gain: { color: colors.errorDark },
    selectedSummary: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2, padding: spacing.x3, borderRadius: radius.control, backgroundColor: colors.primarySoft, marginTop: spacing.x4 },
    selectedText: { ...typography.supporting, color: colors.textPrimary, flex: 1 },
    chart: { minHeight: 184, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x1, marginTop: spacing.x4 },
    point: { minWidth: 44, minHeight: 176, flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    track: { width: 22, height: 132, borderRadius: radius.round, backgroundColor: colors.surfaceMuted, justifyContent: 'flex-end', overflow: 'hidden' },
    trackActive: { backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
    fill: { width: '100%', borderRadius: radius.round },
    fillLoss: { backgroundColor: colors.success },
    fillGain: { backgroundColor: colors.error },
    date: { ...typography.caption, fontSize: 10, color: colors.textTertiary, marginTop: spacing.x2, textAlign: 'center' },
    dateActive: { color: colors.primaryDark },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.x4, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.x3 },
    caption: { ...typography.caption, color: colors.textTertiary },
    footerValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    pressed: { opacity: 0.8 },
});

export default WeightProgressCard;
