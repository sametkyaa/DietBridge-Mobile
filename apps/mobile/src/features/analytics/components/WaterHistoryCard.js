import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { AppCard, EmptyState, Icon } from '../../../shared/components/ui';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { fontFamilies } from '../../../shared/theme/fonts';
import { toLocalDateKey } from '../../../shared/utils/localDate';

const {
    WATER_PERIODS,
    buildWaterSeries,
    describeWaterSummary,
    formatLiters,
    summarizeWaterSeries,
} = require('../utils/waterInsights.cjs');

const CHART_TOP = 22;
const PLOT_HEIGHT = 104;
const LABEL_ROWS = { 7: 34, 30: 20 };
const GAPS = { 7: 10, 30: 3 };
const EMPTY_BAR_LITERS = 0.15;
const GOAL_PILL_WIDTH = 78;

function PeriodSwitch({ value, onChange }) {
    return (
        <View style={styles.segment} accessibilityRole="tablist">
            {WATER_PERIODS.map((days) => {
                const selected = days === value;
                return (
                    <Pressable
                        key={days}
                        onPress={() => onChange(days)}
                        accessibilityRole="tab"
                        accessibilityLabel={`Son ${days} gün`}
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [styles.segmentButton, selected && styles.segmentSelected, pressed && !selected && styles.pressed]}
                    >
                        <Text style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{days} gün</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function WaterChart({ series, goalLiters, reachesGoal, width }) {
    const days = series.length;
    const labelRow = LABEL_ROWS[days] ?? LABEL_ROWS[30];
    const height = CHART_TOP + PLOT_HEIGHT + labelRow;
    const maxAmount = Math.max(0, ...series.map((item) => item.amount ?? 0));
    const yMax = Math.max(goalLiters ? goalLiters * 1.15 : 0, maxAmount * 1.05, 0.5);
    const y = (liters) => CHART_TOP + PLOT_HEIGHT - (Math.min(liters, yMax) / yMax) * PLOT_HEIGHT;
    const gap = GAPS[days] ?? GAPS[30];
    const barWidth = Math.max(2, (width - gap * (days - 1)) / days);
    const corner = days > 7 ? 2 : 8;
    const baseline = y(0);
    const goalY = goalLiters ? y(goalLiters) : null;

    return (
        <Svg width={width} height={height}>
            {series.map((item, index) => {
                const x = index * (barWidth + gap);
                const center = x + barWidth / 2;
                const showDate = days > 7 && (index % 7 === 2 || index === days - 1);
                return (
                    <React.Fragment key={item.dateKey}>
                        {item.amount === null ? (
                            <Rect
                                x={x + 0.5}
                                y={y(EMPTY_BAR_LITERS)}
                                width={Math.max(1, barWidth - 1)}
                                height={baseline - y(EMPTY_BAR_LITERS)}
                                rx={corner}
                                fill={colors.tealSoft}
                                stroke={colors.textTertiary}
                                strokeOpacity={0.6}
                                strokeWidth={1}
                                strokeDasharray="3 3"
                            />
                        ) : (
                            <Rect
                                x={x}
                                y={y(item.amount)}
                                width={barWidth}
                                height={Math.max(2, baseline - y(item.amount))}
                                rx={corner}
                                fill={reachesGoal(item) ? colors.tealDark : colors.teal}
                            />
                        )}
                        {days === 7 ? (
                            <>
                                <SvgText x={center} y={height - 18} textAnchor="middle" fontSize={12} fontFamily={fontFamilies.medium} fill={colors.textPrimary}>
                                    {item.amount === null ? '—' : formatLiters(item.amount)}
                                </SvgText>
                                <SvgText x={center} y={height - 3} textAnchor="middle" fontSize={11} fontFamily={fontFamilies.regular} fill={colors.textTertiary}>
                                    {item.day}
                                </SvgText>
                            </>
                        ) : null}
                        {showDate ? (
                            <SvgText
                                x={Math.min(width - 18, Math.max(18, center))}
                                y={height - 4}
                                textAnchor="middle"
                                fontSize={11}
                                fontFamily={fontFamilies.regular}
                                fill={colors.textTertiary}
                            >
                                {item.dateLabel}
                            </SvgText>
                        ) : null}
                    </React.Fragment>
                );
            })}
            {goalY !== null ? (
                <>
                    <Line x1={0} x2={width} y1={goalY} y2={goalY} stroke={colors.primary} strokeWidth={1.5} strokeDasharray="5 4" />
                    <Rect x={width - GOAL_PILL_WIDTH} y={goalY - 20} width={GOAL_PILL_WIDTH} height={17} rx={8.5} fill={colors.primarySoft} />
                    <SvgText
                        x={width - GOAL_PILL_WIDTH / 2}
                        y={goalY - 7.5}
                        textAnchor="middle"
                        fontSize={11}
                        fontFamily={fontFamilies.semiBold}
                        fill={colors.primaryDark}
                    >
                        {`Hedef ${formatLiters(goalLiters)} L`}
                    </SvgText>
                </>
            ) : null}
        </Svg>
    );
}

export function WaterHistoryCard({ history, goalLiters }) {
    const [period, setPeriod] = useState(WATER_PERIODS[0]);
    const [chartWidth, setChartWidth] = useState(0);
    const reduced = useReducedMotion();
    const fade = useRef(new Animated.Value(1)).current;
    const todayKey = toLocalDateKey();
    const goal = Number.isFinite(goalLiters) && goalLiters > 0 ? goalLiters : null;

    const series = useMemo(() => buildWaterSeries(history, todayKey, period), [history, todayKey, period]);
    const summary = useMemo(() => summarizeWaterSeries(series, goal), [series, goal]);

    useEffect(() => {
        if (reduced) return undefined;
        fade.setValue(0.35);
        const animation = Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true });
        animation.start();
        return () => animation.stop();
    }, [fade, period, reduced]);

    if (!Array.isArray(history) || history.length === 0) {
        return (
            <AppCard>
                <Text style={styles.heading} accessibilityRole="header">Su</Text>
                <EmptyState icon="droplet" title="Su kaydı bulunmuyor" description="Son 30 gündeki kayıtlar burada görünür." />
            </AppCard>
        );
    }

    const chartLabel = summary.average === null
        ? `Son ${period} günde su kaydı yok`
        : `Son ${period} gün, günlük ortalama ${formatLiters(summary.average)} litre, ${summary.goalDays} gün hedefe ulaşıldı`;

    return (
        <AppCard>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Icon name="droplet" size={18} color={colors.tealDark} />
                    <Text style={styles.heading} accessibilityRole="header">Su</Text>
                </View>
                <PeriodSwitch value={period} onChange={setPeriod} />
            </View>

            <View style={styles.hero}>
                <Text style={styles.average}>{summary.average === null ? '—' : formatLiters(summary.average)}</Text>
                <Text style={styles.averageUnit}>L / gün ortalama</Text>
            </View>

            <Animated.View
                style={[styles.chart, { opacity: fade }]}
                onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}
                accessible
                accessibilityRole="image"
                accessibilityLabel={chartLabel}
            >
                {chartWidth > 0 ? (
                    <WaterChart series={series} goalLiters={goal} reachesGoal={summary.reachesGoal} width={chartWidth} />
                ) : null}
            </Animated.View>

            <View style={styles.legend} importantForAccessibility="no-hide-descendants">
                {goal ? <LegendItem swatchStyle={styles.swatchGoal} label="Hedefe ulaştı" /> : null}
                <LegendItem swatchStyle={styles.swatchBelow} label={goal ? 'Hedefin altında' : 'Kayıt'} />
                <LegendItem swatchStyle={styles.swatchEmpty} label="Kayıt yok" />
            </View>

            <View style={styles.stats}>
                <View style={[styles.stat, styles.statFirst]}>
                    <Text style={styles.statLabel}>Hedefe ulaşılan</Text>
                    <Text style={styles.statValue}>{summary.goalDays}<Text style={styles.statUnit}>/{period} gün</Text></Text>
                </View>
                <View style={[styles.stat, styles.statDivider]}>
                    <Text style={styles.statLabel}>En iyi gün</Text>
                    <Text style={styles.statValue}>{summary.best ? formatLiters(summary.best.amount) : '—'}<Text style={styles.statUnit}> L</Text></Text>
                    {summary.best ? <Text style={styles.statLabel}>{period === 7 ? summary.best.dayName : summary.best.dateLabel}</Text> : null}
                </View>
                <View style={[styles.stat, styles.statDivider]}>
                    <Text style={styles.statLabel}>Toplam</Text>
                    <Text style={styles.statValue}>{formatLiters(summary.total)}<Text style={styles.statUnit}> L</Text></Text>
                </View>
            </View>

            <View style={styles.insight}>
                <Text style={styles.insightText}>{describeWaterSummary(summary, goal)}</Text>
            </View>
        </AppCard>
    );
}

function LegendItem({ swatchStyle, label }) {
    return (
        <View style={styles.legendItem}>
            <View style={[styles.swatch, swatchStyle]} />
            <Text style={styles.legendLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.x3 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    segment: { flexDirection: 'row', backgroundColor: colors.tealSoft, borderRadius: radius.round, padding: 3 },
    segmentButton: { minHeight: 32, paddingHorizontal: spacing.x3, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    segmentSelected: { backgroundColor: colors.surface },
    segmentLabel: { ...typography.supporting, fontFamily: fontFamilies.semiBold, color: colors.tealDark },
    segmentLabelSelected: { color: colors.textPrimary },
    pressed: { opacity: 0.7 },
    hero: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.x2, marginTop: spacing.x4 },
    average: { ...typography.display, fontSize: 40, lineHeight: 46, fontVariant: ['tabular-nums'], color: colors.textPrimary },
    averageUnit: { ...typography.supporting, color: colors.textTertiary },
    chart: { marginTop: spacing.x3, minHeight: CHART_TOP + PLOT_HEIGHT + LABEL_ROWS[7] },
    legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x4, marginTop: spacing.x2 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendLabel: { ...typography.caption, color: colors.textTertiary },
    swatch: { width: 10, height: 10, borderRadius: 3 },
    swatchGoal: { backgroundColor: colors.tealDark },
    swatchBelow: { backgroundColor: colors.teal },
    swatchEmpty: { backgroundColor: colors.tealSoft, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.textTertiary },
    stats: { flexDirection: 'row', marginTop: spacing.x4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    stat: { flex: 1, minWidth: 0, paddingTop: spacing.x3, paddingHorizontal: spacing.x2 },
    statFirst: { paddingLeft: 0 },
    statDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderStrong },
    statLabel: { ...typography.caption, color: colors.textTertiary },
    statValue: { ...typography.numeric, fontSize: 22, lineHeight: 28, color: colors.textPrimary, marginTop: 2 },
    statUnit: { ...typography.supporting, color: colors.textTertiary },
    insight: { marginTop: spacing.x4, backgroundColor: colors.tealSoft, borderRadius: radius.control, paddingVertical: spacing.x3, paddingHorizontal: spacing.x4 },
    insightText: { ...typography.supporting, fontSize: 14, lineHeight: 20, color: colors.tealDark },
});

export default WaterHistoryCard;
