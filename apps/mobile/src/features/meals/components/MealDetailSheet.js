import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetView, StatusBadge } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { MealPhotoThumbnail } from './MealPhotoThumbnail';
import { formatMealSlotName } from '../../../shared/utils/mealType';
import { PlateMark } from '../../auth/components/BrandMark';

const formatMacro = (value) => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return '—';
    const number = Number(value);
    return Number.isFinite(number) ? String(Math.round(number)) : '—';
};

export function MealDetailSheet({ meal, completion, visible, onClose, onPhotoPress, bottomInset = 0 }) {
    if (!meal) return null;
    const completed = typeof completion?.completed === 'boolean' ? completion.completed : !!meal.isEaten;
    const macros = [
        { label: 'kcal', value: formatMacro(meal.calories) },
        { label: 'protein', value: formatMacro(meal.protein), unit: 'g' },
        { label: 'karb.', value: formatMacro(meal.carbohydrate), unit: 'g' },
        { label: 'yağ', value: formatMacro(meal.fat), unit: 'g' },
    ];
    const description = typeof meal.description === 'string' ? meal.description.trim() : '';
    const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    const steps = Array.isArray(meal.steps) ? meal.steps : [];

    return (
        <BottomSheetView visible={visible} onClose={onClose} scrollable bottomInset={bottomInset}>
            <View style={styles.metaRow}>
                <Text style={styles.time}>{meal.time}</Text>
                <Text style={styles.meta}>{formatMealSlotName(meal)}</Text>
                <View style={styles.flex} />
                <StatusBadge status={completed ? 'completed' : 'upcoming'} label={completed ? 'Tamamlandı' : 'Planlandı'} />
            </View>
            <Text style={styles.title} accessibilityRole="header">{meal.title || formatMealSlotName(meal)}</Text>
            <MealPhotoThumbnail
                photoPath={meal.photoPath}
                completionPhotoPath={completed
                    ? completion?.completionPhotoPath || meal.completionPhotoPath
                    : null}
                localCompletionPhotoUri={completed
                    ? completion?.localCompletionPhotoUri || meal.localCompletionPhotoUri
                    : null}
                imageStyle={styles.photo}
                wrapperStyle={styles.photoButton}
                onPress={onPhotoPress}
                accessibilityLabel={`${meal.title || formatMealSlotName(meal)} fotoğrafını büyüt`}
                fallback={(
                    <View style={styles.photoFallback}>
                        <PlateMark size={104} />
                    </View>
                )}
            />
            <View style={styles.macroGrid}>
                {macros.map((macro, index) => (
                    <View key={macro.label} style={[styles.macroCell, index > 0 && styles.macroDivider]}>
                        <Text style={styles.macroValue}>
                            {macro.value}
                            {macro.unit && macro.value !== '—' ? <Text style={styles.macroUnit}> {macro.unit}</Text> : null}
                        </Text>
                        <Text style={styles.macroLabel}>{macro.label}</Text>
                    </View>
                ))}
            </View>
            {description ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">İçerik</Text>
                    <Text style={styles.body}>{description}</Text>
                </View>
            ) : null}
            {meal.note ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Diyetisyen notu</Text>
                    <Text style={styles.body}>{meal.note}</Text>
                </View>
            ) : null}
            {ingredients.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Malzemeler</Text>
                    {ingredients.map((item, index) => (
                        <View key={`${index}-${item}`} style={styles.listRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.listText}>{item}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
            {steps.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Hazırlanış</Text>
                    {steps.map((step, index) => (
                        <View key={`${index}-${step}`} style={styles.listRow}>
                            <Text style={styles.stepNumber}>{index + 1}</Text>
                            <Text style={styles.listText}>{step}</Text>
                        </View>
                    ))}
                </View>
            ) : null}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    time: { ...typography.numericSmall, color: colors.primaryDark },
    meta: { ...typography.supporting, color: colors.textSecondary },
    title: { ...typography.screenTitle, fontSize: 24, lineHeight: 30, color: colors.textPrimary, marginTop: spacing.x1 },
    photoButton: { width: '100%', marginTop: spacing.x2 },
    photo: { width: '100%', height: 200, borderRadius: radius.card },
    photoFallback: { width: '100%', height: 168, borderRadius: radius.card, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginTop: spacing.x2 },
    macroGrid: { flexDirection: 'row', paddingVertical: spacing.x3, marginTop: spacing.x1 },
    macroCell: { flex: 1, paddingHorizontal: spacing.x2 },
    macroDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderStrong },
    macroValue: { ...typography.numeric, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
    macroUnit: { ...typography.supporting, color: colors.textTertiary },
    macroLabel: { ...typography.caption, color: colors.textTertiary, marginTop: 2 },
    section: { gap: spacing.x2, paddingTop: spacing.x4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    sectionTitle: { ...typography.cardTitle, fontSize: 16, color: colors.textPrimary },
    body: { ...typography.body, color: colors.textSecondary },
    listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8 },
    stepNumber: { ...typography.numericSmall, fontSize: 15, color: colors.primaryDark, width: 18 },
    listText: { ...typography.body, color: colors.textPrimary, flex: 1 },
});

export default MealDetailSheet;
