import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../../shared/components/ui';
import { useReducedMotion } from '../../../../shared/hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const DAY_WIDTH = 46;
const DAY_GAP = 6;

export function MealPlanHeader({ dayOptions, selectedDay, todayIndex, onSelectDay, onOpenGrocery, groceryDisabled }) {
    const reduced = useReducedMotion();
    const offset = useRef(new Animated.Value(selectedDay * (DAY_WIDTH + DAY_GAP))).current;

    useEffect(() => {
        const toValue = selectedDay * (DAY_WIDTH + DAY_GAP);
        if (reduced) {
            offset.setValue(toValue);
            return;
        }
        Animated.spring(offset, { toValue, speed: 16, bounciness: 5, useNativeDriver: true }).start();
    }, [offset, reduced, selectedDay]);

    return (
        <View>
            <View style={styles.titleRow}>
                <View style={styles.titleWrap}>
                    <Text style={styles.title} accessibilityRole="header">Öğün planım</Text>
                    <Text style={styles.subtitle}>Diyetisyeninizin bu hafta için hazırladığı plan</Text>
                </View>
                <Pressable
                    onPress={onOpenGrocery}
                    disabled={groceryDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Alışveriş listesini aç"
                    accessibilityState={{ disabled: groceryDisabled }}
                    style={({ pressed }) => [styles.cartButton, groceryDisabled && styles.disabled, pressed && !groceryDisabled && styles.pressed]}
                >
                    <Icon name="cart" size={22} color={colors.primaryDark} />
                </Pressable>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.days}
            >
                <View pointerEvents="none" style={styles.dayTrack}>
                    {dayOptions.map((option, index) => (
                        <View key={`bg-${index}-${option}`} style={[styles.dayBackground, { left: index * (DAY_WIDTH + DAY_GAP) }]} />
                    ))}
                    <Animated.View style={[styles.dayIndicator, { transform: [{ translateX: offset }] }]} />
                </View>
                {dayOptions.map((option, index) => {
                    const [dayLabel, dateLabel] = option.split(' ');
                    const selected = index === selectedDay;
                    const isToday = index === todayIndex;
                    return (
                        <Pressable
                            key={`${index}-${option}`}
                            onPress={() => onSelectDay(index)}
                            accessibilityRole="button"
                            accessibilityLabel={`${dayLabel} ${dateLabel}${isToday ? ', bugün' : ''}`}
                            accessibilityState={{ selected }}
                            style={({ pressed }) => [styles.day, pressed && styles.pressed]}
                        >
                            <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>{dayLabel}</Text>
                            <Text style={[styles.dateLabel, selected && styles.dateLabelSelected]}>{dateLabel}</Text>
                            <View style={[styles.todayDot, selected && styles.todayDotSelected, !isToday && styles.todayDotHidden]} />
                        </Pressable>
                    );
                })}
            </ScrollView>
            <Text style={styles.selectedLabel} accessibilityRole="header">{dayOptions[selectedDay]}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    titleWrap: { flex: 1, minWidth: 0 },
    title: { ...typography.screenTitle, color: colors.textPrimary },
    subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    cartButton: { width: 48, height: 48, borderRadius: radius.round, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
    days: { gap: DAY_GAP, paddingTop: spacing.x5, paddingBottom: spacing.x6 },
    dayTrack: { position: 'absolute', top: spacing.x5, bottom: spacing.x6, left: 0, right: 0 },
    dayBackground: { position: 'absolute', top: 0, bottom: 0, width: DAY_WIDTH, borderRadius: radius.round, backgroundColor: colors.surface },
    dayIndicator: { position: 'absolute', top: 0, bottom: 0, left: 0, width: DAY_WIDTH, borderRadius: radius.round, backgroundColor: colors.primaryDark },
    day: { width: DAY_WIDTH, minHeight: 72, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center', gap: 2 },
    dayLabel: { ...typography.caption, color: colors.textTertiary },
    dayLabelSelected: { color: colors.primarySoft },
    dateLabel: { ...typography.numericSmall, color: colors.textPrimary },
    dateLabelSelected: { color: colors.textOnPrimary },
    todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primaryDark, marginTop: 2 },
    todayDotSelected: { backgroundColor: colors.accent },
    todayDotHidden: { opacity: 0 },
    selectedLabel: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.x4 },
    pressed: { opacity: 0.8 },
    disabled: { opacity: 0.5 },
});

export default MealPlanHeader;
