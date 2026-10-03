import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { AppButton, AppCard, EmptyState } from '../../../shared/components/ui';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const formatKg = (value) => Number(value).toFixed(1).replace('.', ',');
const formatChange = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatKg(Math.abs(value))} kg`;
const CHART_HEIGHT = 140;
const PAD_Y = 16;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const getPathLength = (points) => points.reduce((total, point, index) => {
    if (index === 0) return 0;
    const previous = points[index - 1];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
}, 0);

function WeightLine({ data, selectedIndex, width }) {
    const weights = data.map((item) => Number(item.weight));
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const span = Math.max(max - min, 0.5);
    const step = data.length > 1 ? width / (data.length - 1) : 0;
    const points = weights.map((weight, index) => ({
        x: index * step,
        y: PAD_Y + (1 - (weight - min) / span) * (CHART_HEIGHT - PAD_Y * 2),
    }));
    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const area = `${line} L ${points[points.length - 1].x} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;
    const selected = points[selectedIndex];
    const length = Math.max(1, Math.ceil(getPathLength(points)));
    const reduced = useReducedMotion();
    const draw = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (reduced) {
            draw.setValue(1);
            return undefined;
        }
        draw.setValue(0);
        const animation = Animated.timing(draw, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
        });
        animation.start();
        return () => animation.stop();
    }, [draw, line, reduced]);

    const dashOffset = draw.interpolate({ inputRange: [0, 1], outputRange: [length, 0] });

    return (
        <Svg width={width} height={CHART_HEIGHT} style={styles.svg}>
            {[0.25, 0.5, 0.75].map((ratio) => (
                <Line key={ratio} x1={0} x2={width} y1={CHART_HEIGHT * ratio} y2={CHART_HEIGHT * ratio} stroke={colors.borderSoft} strokeWidth={1} />
            ))}
            <AnimatedPath d={area} fill={colors.primarySurface} fillOpacity={draw} />
            <AnimatedPath
                d={line}
                stroke={colors.primaryDark}
                strokeWidth={2.5}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={`${length} ${length}`}
                strokeDashoffset={dashOffset}
            />
            {selected ? <Line x1={selected.x} x2={selected.x} y1={selected.y} y2={CHART_HEIGHT} stroke={colors.primary} strokeWidth={1} strokeDasharray="3 4" /> : null}
            {points.map((point, index) => (
                <Circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={index === selectedIndex ? 6 : 3.5}
                    fill={index === selectedIndex ? colors.accent : colors.surface}
                    stroke={colors.primaryDark}
                    strokeWidth={2}
                />
            ))}
        </Svg>
    );
}

export function WeightProgressCard({ data, selectedIndex, onSelect, currentWeight, startWeight, weightChange, monthLabel, onAddWeight }) {
    const [chartWidth, setChartWidth] = useState(0);

    if (data.length === 0) {
        return (
            <AppCard>
                <View style={styles.emptyHeader}>
                    <Text style={styles.heading} accessibilityRole="header">Kilo</Text>
                    <AppButton variant="text" label="Kilo ekle" onPress={onAddWeight} />
                </View>
                <EmptyState icon="analytics" title="Kilo geçmişi bulunmuyor" description="Ana sayfadan kilo kaydı eklediğinde burada görünür." />
            </AppCard>
        );
    }

    const safeIndex = Math.min(selectedIndex, data.length - 1);
    const selected = data[safeIndex];
    return (
        <AppCard>
            <View style={styles.header}>
                <View>
                    <Text style={styles.heading} accessibilityRole="header">Kilo</Text>
                    <Text style={styles.supporting}>{monthLabel}</Text>
                </View>
                <AppButton variant="text" label="Kilo ekle" onPress={onAddWeight} />
            </View>

            <View style={styles.hero}>
                <Text style={styles.current}>
                    {formatKg(currentWeight)}<Text style={styles.unit}> kg</Text>
                </Text>
                <View style={[styles.changePill, weightChange > 0 && styles.changePillGain]}>
                    <Text style={[styles.changeText, weightChange > 0 && styles.changeTextGain]}>{formatChange(weightChange)}</Text>
                </View>
            </View>
            <Text style={styles.supporting}>Başlangıçtan bu yana, {formatKg(startWeight)} kg ile başladın.</Text>

            {data.length < 2 ? (
                <Text style={[styles.supporting, styles.chartNote]}>Grafik için en az iki kilo ölçümü gerekir.</Text>
            ) : (
                <View style={styles.chartWrap}>
                    <View style={styles.chart} onLayout={(event) => setChartWidth(event.nativeEvent.layout.width)}>
                        {chartWidth > 0 ? <WeightLine data={data} selectedIndex={safeIndex} width={chartWidth} /> : null}
                        <View style={styles.hitRow}>
                            {data.map((item, index) => (
                                <Pressable
                                    key={`${item.week}-${item.dateLabel}`}
                                    onPress={() => onSelect(index)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${item.dateLabel}, ${formatKg(item.weight)} kilogram${index === 0 ? ', başlangıç kaydı' : `, değişim ${formatChange(item.change)}`}`}
                                    accessibilityState={{ selected: index === safeIndex }}
                                    style={styles.hit}
                                />
                            ))}
                        </View>
                    </View>
                    <View style={styles.labels}>
                        {data.map((item, index) => (
                            <Text key={`${item.week}-${item.dateLabel}`} style={[styles.date, index === safeIndex && styles.dateActive]}>{item.dateLabel}</Text>
                        ))}
                    </View>
                    <View style={styles.selectedRow} accessibilityLiveRegion="polite">
                        <Text style={styles.selectedDate}>{selected.dateLabel}</Text>
                        <Text style={styles.selectedValue}>
                            {formatKg(selected.weight)} kg
                            <Text style={styles.selectedChange}>  {safeIndex === 0 ? 'başlangıç' : formatChange(selected.change)}</Text>
                        </Text>
                    </View>
                </View>
            )}
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.x3 },
    emptyHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginTop: spacing.x3 },
    current: { ...typography.numeric, fontSize: 40, lineHeight: 46, letterSpacing: -1, color: colors.textPrimary },
    unit: { ...typography.body, letterSpacing: 0, color: colors.textTertiary },
    changePill: { borderRadius: radius.round, paddingHorizontal: spacing.x3, paddingVertical: spacing.x1, backgroundColor: colors.accentSoft },
    changePillGain: { backgroundColor: colors.warningSoft },
    changeText: { ...typography.supporting, fontFamily: typography.button.fontFamily, fontVariant: ['tabular-nums'], color: colors.accentDark },
    changeTextGain: { color: colors.warningDark },
    chartNote: { marginTop: spacing.x4 },
    chartWrap: { marginTop: spacing.x5 },
    chart: { height: CHART_HEIGHT, marginHorizontal: spacing.x2 },
    svg: { overflow: 'visible' },
    hitRow: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', marginHorizontal: -spacing.x4 },
    hit: { flex: 1, minWidth: 44 },
    labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.x2 },
    date: { ...typography.caption, color: colors.textTertiary },
    dateActive: { color: colors.primaryDark, fontFamily: typography.button.fontFamily },
    selectedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: spacing.x4, paddingTop: spacing.x3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    selectedDate: { ...typography.supporting, color: colors.textSecondary },
    selectedValue: { ...typography.numericSmall, color: colors.textPrimary },
    selectedChange: { ...typography.supporting, color: colors.textSecondary },
});

export default WeightProgressCard;
