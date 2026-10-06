import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon } from '../../../../shared/components/ui';
import { PopIn } from '../../../../shared/components/motion';
import { useHasMounted } from '../../../../shared/hooks/useHasMounted';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { formatMealSlotName } from '../../../../shared/utils/mealType';

const NODE_SIZE = 26;

export function TodayMealsCard({ meals, updatingMealId, onMealPress, onToggle }) {
    const hasMounted = useHasMounted();
    if (!Array.isArray(meals) || meals.length === 0) return null;
    const nextMealId = meals.find((meal) => !meal.isEaten)?.id;

    return (
        <AppCard>
            <Text style={styles.heading} accessibilityRole="header">Günün akışı</Text>
            <View>
                {meals.map((meal, index) => {
                    const updating = updatingMealId === meal.id;
                    const isNext = meal.id === nextMealId;
                    const isLast = index === meals.length - 1;
                    return (
                        <View key={meal.id} style={styles.row}>
                            <Text style={[styles.time, meal.isEaten && styles.muted, isNext && styles.timeNext]}>{meal.time}</Text>

                            <View style={styles.railColumn}>
                                {index > 0 ? <View style={[styles.rail, styles.railTop, meal.isEaten && styles.railDone]} /> : null}
                                {!isLast ? <View style={[styles.rail, styles.railBottom, meal.isEaten && styles.railDone]} /> : null}
                                <Pressable
                                    onPress={() => onToggle(meal.id)}
                                    disabled={updating}
                                    accessibilityRole="checkbox"
                                    accessibilityLabel={`${meal.title} öğününü ${meal.isEaten ? 'tamamlanmamış' : 'tamamlanmış'} olarak işaretle`}
                                    accessibilityState={{ checked: meal.isEaten, disabled: updating, busy: updating }}
                                    hitSlop={10}
                                    style={({ pressed }) => [
                                        styles.node,
                                        isNext && styles.nodeNext,
                                        meal.isEaten && styles.nodeDone,
                                        pressed && !updating && styles.pressed,
                                        updating && styles.nodeDisabled,
                                    ]}
                                >
                                    {meal.isEaten ? <PopIn animate={hasMounted}><Icon name="check" size={15} color={colors.textOnPrimary} /></PopIn> : null}
                                </Pressable>
                            </View>

                            <Pressable
                                onPress={() => onMealPress(meal.id)}
                                accessibilityRole="button"
                                accessibilityLabel={`${meal.time}, ${meal.title}, ayrıntıları aç`}
                                style={({ pressed }) => [styles.content, isNext && styles.contentNext, pressed && styles.pressed]}
                            >
                                <Text style={[styles.title, meal.isEaten && styles.muted]} numberOfLines={2}>{meal.title}</Text>
                                <Text style={styles.type}>{formatMealSlotName(meal)}</Text>
                            </Pressable>
                        </View>
                    );
                })}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    heading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.x3 },
    row: { flexDirection: 'row', alignItems: 'stretch', minHeight: 72 },
    time: { ...typography.caption, fontSize: 13, fontVariant: ['tabular-nums'], color: colors.textSecondary, width: 44, paddingTop: spacing.x4 },
    timeNext: { color: colors.primaryDark, fontFamily: typography.button.fontFamily },
    railColumn: { width: 44, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 11 },
    rail: { position: 'absolute', left: 21, width: 2, backgroundColor: colors.borderSoft },
    railTop: { top: 0, height: 12 },
    railBottom: { top: 12 + NODE_SIZE, bottom: 0 },
    railDone: { backgroundColor: colors.primarySoft },
    node: {
        width: NODE_SIZE,
        height: NODE_SIZE,
        borderRadius: radius.round,
        borderWidth: 2,
        borderColor: colors.borderStrong,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nodeNext: { borderColor: colors.primaryDark, backgroundColor: colors.accent },
    nodeDone: { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark },
    nodeDisabled: { opacity: 0.55 },
    content: { flex: 1, minWidth: 0, paddingVertical: spacing.x3, paddingHorizontal: spacing.x3, marginBottom: spacing.x1, borderRadius: radius.control },
    contentNext: { backgroundColor: colors.primarySurface },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    type: { ...typography.supporting, color: colors.textTertiary, marginTop: 2 },
    muted: { color: colors.textSecondary },
    pressed: { opacity: 0.7 },
});

export default TodayMealsCard;
