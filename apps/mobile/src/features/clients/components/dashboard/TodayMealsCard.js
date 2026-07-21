import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon, StatusBadge } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { MealPhotoThumbnail } from '../../../meals/components/MealPhotoThumbnail';

export function TodayMealsCard({ meals, updatingMealId, onMealPress, onToggle }) {
    if (!Array.isArray(meals) || meals.length === 0) return null;

    return (
        <AppCard>
            <Text style={styles.heading} accessibilityRole="header">Bugünün öğünleri</Text>
            <View style={styles.list}>
                {meals.map((meal) => {
                    const updating = updatingMealId === meal.id;
                    return (
                        <View key={meal.id} style={styles.row}>
                            <Pressable
                                onPress={() => onMealPress(meal.id)}
                                accessibilityRole="button"
                                accessibilityLabel={`${meal.time}, ${meal.title}, ayrıntıları aç`}
                                style={({ pressed }) => [styles.detailButton, pressed && styles.pressed]}
                            >
                                <MealPhotoThumbnail
                                    photoPath={meal.photoPath}
                                    completionPhotoUri={meal.completionPhotoUri}
                                    imageStyle={styles.photo}
                                    fallback={(
                                        <View style={styles.photoFallback}>
                                            <Icon name="meal" size={20} color={colors.primaryDark} />
                                        </View>
                                    )}
                                />
                                <View style={styles.textWrap}>
                                    <Text style={styles.time}>{meal.time} · {meal.type}</Text>
                                    <Text style={styles.title} numberOfLines={1}>{meal.title}</Text>
                                    <StatusBadge status={meal.status} label={meal.badgeLabel} />
                                </View>
                            </Pressable>
                            <Pressable
                                onPress={() => onToggle(meal.id)}
                                disabled={updating}
                                accessibilityRole="checkbox"
                                accessibilityLabel={`${meal.title} öğününü ${meal.isEaten ? 'tamamlanmamış' : 'tamamlanmış'} olarak işaretle`}
                                accessibilityState={{ checked: meal.isEaten, disabled: updating, busy: updating }}
                                hitSlop={8}
                                style={({ pressed }) => [
                                    styles.toggle,
                                    meal.isEaten && styles.toggleChecked,
                                    pressed && !updating && styles.pressed,
                                    updating && styles.toggleDisabled,
                                ]}
                            >
                                <Icon name={meal.isEaten ? 'check' : 'plus'} size={20} color={meal.isEaten ? colors.white : colors.primaryDark} />
                            </Pressable>
                        </View>
                    );
                })}
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    heading: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.x2 },
    list: { gap: spacing.x1 },
    row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.x2, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingVertical: spacing.x2 },
    detailButton: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingVertical: spacing.x1 },
    photo: { width: 48, height: 48, borderRadius: radius.small },
    photoFallback: { width: 48, height: 48, borderRadius: radius.small, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    textWrap: { flex: 1, minWidth: 0 },
    time: { ...typography.caption, color: colors.textSecondary },
    title: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    toggle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
    toggleChecked: { backgroundColor: colors.primaryDark },
    toggleDisabled: { opacity: 0.55 },
    pressed: { opacity: 0.8 },
});

export default TodayMealsCard;
