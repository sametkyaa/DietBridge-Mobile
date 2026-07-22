import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon, StatusBadge } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { MealPhotoThumbnail } from '../MealPhotoThumbnail';
import { formatMealType } from '../../../../shared/utils/mealType';

export function MealPlanItem({ meal, completion, onPress }) {
    const completed = !!completion?.completed;
    return (
        <AppCard style={styles.card}>
            <Pressable
                onPress={() => onPress(meal)}
                accessibilityRole="button"
                accessibilityLabel={`${meal.time}, ${meal.title || formatMealType(meal.type)}, ${completed ? 'tamamlandı' : 'planlandı'}, ayrıntıları aç`}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
                <MealPhotoThumbnail
                    photoPath={meal.photoPath}
                    completionPhotoUri={completion?.completionPhotoUri}
                    imageStyle={styles.photo}
                    fallback={(
                        <View style={styles.photoFallback}>
                            <Icon name="meal" size={22} color={colors.primaryDark} />
                        </View>
                    )}
                />
                <View style={styles.textWrap}>
                    <Text style={styles.meta}>{meal.time} · {formatMealType(meal.type)}</Text>
                    <Text style={styles.title} numberOfLines={2}>{meal.title || formatMealType(meal.type)}</Text>
                </View>
                <View style={styles.trailing}>
                    <StatusBadge status={completed ? 'completed' : 'upcoming'} label={completed ? 'Tamamlandı' : 'Planlandı'} />
                    <Icon name="chevronRight" color={colors.textTertiary} />
                </View>
            </Pressable>
            {meal.note ? <Text style={styles.note} numberOfLines={2}>{meal.note}</Text> : null}
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: { overflow: 'hidden', padding: 0 },
    row: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, padding: spacing.x4 },
    photo: { width: 56, height: 56, borderRadius: radius.small },
    photoFallback: { width: 56, height: 56, borderRadius: radius.small, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    textWrap: { flex: 1, minWidth: 0 },
    meta: { ...typography.caption, color: colors.textSecondary },
    title: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    trailing: { alignItems: 'flex-end', gap: spacing.x2 },
    note: { ...typography.supporting, color: colors.textSecondary, backgroundColor: colors.primarySurface, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
    pressed: { opacity: 0.82 },
});

export default MealPlanItem;
