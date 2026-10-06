import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../../shared/components/ui';
import { PopIn } from '../../../../shared/components/motion';
import { useHasMounted } from '../../../../shared/hooks/useHasMounted';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { MealPhotoThumbnail } from '../MealPhotoThumbnail';
import { formatMealSlotName } from '../../../../shared/utils/mealType';

const isFiniteValue = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

export function MealPlanItem({ meal, completion, onPress }) {
    const completed = !!completion?.completed;
    const hasMounted = useHasMounted();
    const title = meal.title || formatMealSlotName(meal);
    return (
        <View style={styles.row}>
            <View style={styles.timeColumn}>
                <Text style={[styles.time, completed && styles.muted]}>{meal.time}</Text>
                <View style={[styles.node, completed && styles.nodeDone]}>
                    {completed ? <PopIn animate={hasMounted}><Icon name="check" size={11} color={colors.textOnPrimary} /></PopIn> : null}
                </View>
                <View style={[styles.rail, completed && styles.railDone]} />
            </View>
            <Pressable
                onPress={() => onPress(meal)}
                accessibilityRole="button"
                accessibilityLabel={`${meal.time}, ${title}, ${completed ? 'tamamlandı' : 'planlandı'}, ayrıntıları aç`}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
                <View style={styles.textWrap}>
                    <Text style={styles.type}>{formatMealSlotName(meal)}</Text>
                    <Text style={[styles.title, completed && styles.muted]} numberOfLines={2}>{title}</Text>
                    <View style={styles.metaRow}>
                        {isFiniteValue(meal.calories) ? (
                            <Text style={styles.meta}>{Math.round(Number(meal.calories))} kcal</Text>
                        ) : null}
                        {completed ? <Text style={styles.done}>Tamamlandı</Text> : null}
                    </View>
                </View>
                <MealPhotoThumbnail
                    photoPath={meal.photoPath}
                    completionPhotoPath={completion?.completionPhotoPath}
                    localCompletionPhotoUri={completion?.localCompletionPhotoUri}
                    imageStyle={styles.photo}
                    fallback={<Icon name="chevronRight" color={colors.textTertiary} />}
                />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.x3 },
    timeColumn: { width: 48, alignItems: 'center', paddingTop: spacing.x4 },
    time: { ...typography.caption, fontSize: 13, fontVariant: ['tabular-nums'], color: colors.textPrimary },
    node: {
        width: 16,
        height: 16,
        marginTop: spacing.x2,
        borderRadius: radius.round,
        borderWidth: 2,
        borderColor: colors.borderStrong,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    nodeDone: { borderColor: colors.primaryDark, backgroundColor: colors.primaryDark },
    rail: { flex: 1, width: 2, marginTop: spacing.x1, backgroundColor: colors.borderSoft },
    railDone: { backgroundColor: colors.primarySoft },
    card: {
        flex: 1,
        minWidth: 0,
        minHeight: 88,
        marginBottom: spacing.x3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x3,
        padding: spacing.x4,
        borderRadius: radius.card,
        backgroundColor: colors.surface,
    },
    textWrap: { flex: 1, minWidth: 0 },
    type: { ...typography.caption, color: colors.textTertiary },
    title: { ...typography.cardTitle, color: colors.textPrimary, marginTop: 2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginTop: spacing.x2 },
    meta: { ...typography.supporting, fontVariant: ['tabular-nums'], color: colors.textSecondary },
    done: { ...typography.supporting, fontFamily: typography.button.fontFamily, color: colors.primaryDark },
    photo: { width: 60, height: 60, borderRadius: radius.control },
    muted: { color: colors.textSecondary },
    pressed: { opacity: 0.82 },
});

export default MealPlanItem;
