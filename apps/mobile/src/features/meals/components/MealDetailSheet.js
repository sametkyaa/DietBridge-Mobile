import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetView, Icon, StatusBadge } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { MealPhotoThumbnail } from './MealPhotoThumbnail';

const valueOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

export function MealDetailSheet({ meal, completion, visible, onClose, onPhotoPress, bottomInset = 0 }) {
    if (!meal) return null;
    const completed = !!completion?.completed || !!meal.isEaten;
    const macros = [
        { label: 'Kalori', value: meal.calories === null || meal.calories === undefined ? '—' : `${Math.round(valueOrZero(meal.calories))} kcal` },
        { label: 'Protein', value: `${Math.round(valueOrZero(meal.protein))} g` },
        { label: 'Karbonhidrat', value: `${Math.round(valueOrZero(meal.carbohydrate))} g` },
        { label: 'Yağ', value: `${Math.round(valueOrZero(meal.fat))} g` },
    ];
    const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
    const steps = Array.isArray(meal.steps) ? meal.steps : [];

    return (
        <BottomSheetView visible={visible} onClose={onClose} title="Öğün detayı" scrollable bottomInset={bottomInset}>
            <View style={styles.metaRow}>
                <Text style={styles.meta}>{meal.time} · {meal.type}</Text>
                <StatusBadge status={completed ? 'completed' : 'upcoming'} label={completed ? 'Tamamlandı' : 'Planlandı'} />
            </View>
            <Text style={styles.title}>{meal.title || meal.type}</Text>
            {meal.desc ? <Text style={styles.description}>{meal.desc}</Text> : null}
            <MealPhotoThumbnail
                photoPath={meal.photoPath}
                completionPhotoUri={completion?.completionPhotoUri || meal.completionPhotoUri}
                imageStyle={styles.photo}
                wrapperStyle={styles.photoButton}
                onPress={onPhotoPress}
                accessibilityLabel={`${meal.title || meal.type} fotoğrafını büyüt`}
                fallback={(
                    <View style={styles.photoFallback}>
                        <Icon name="meal" size={36} color={colors.primaryDark} />
                    </View>
                )}
            />
            <View style={styles.macroGrid}>
                {macros.map((macro) => (
                    <View key={macro.label} style={styles.macroCell}>
                        <Text style={styles.macroValue}>{macro.value}</Text>
                        <Text style={styles.macroLabel}>{macro.label}</Text>
                    </View>
                ))}
            </View>
            {meal.note ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Diyetisyen notu</Text>
                    <Text style={styles.body}>{meal.note}</Text>
                </View>
            ) : null}
            {ingredients.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Malzemeler</Text>
                    {ingredients.map((item, index) => <Text key={`${index}-${item}`} style={styles.body}>• {item}</Text>)}
                </View>
            ) : null}
            {steps.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Hazırlanış</Text>
                    {steps.map((step, index) => <Text key={`${index}-${step}`} style={styles.body}>{index + 1}. {step}</Text>)}
                </View>
            ) : null}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    meta: { ...typography.supporting, color: colors.textSecondary },
    title: { ...typography.sectionTitle, color: colors.textPrimary },
    description: { ...typography.body, color: colors.textSecondary },
    photoButton: { width: '100%' },
    photo: { width: '100%', height: 180, borderRadius: radius.card },
    photoFallback: { width: '100%', height: 140, borderRadius: radius.card, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: radius.control, backgroundColor: colors.surfaceMuted, padding: spacing.x2 },
    macroCell: { width: '50%', alignItems: 'center', padding: spacing.x2 },
    macroValue: { ...typography.bodyMedium, color: colors.textPrimary },
    macroLabel: { ...typography.caption, color: colors.textSecondary },
    section: { gap: spacing.x1 },
    sectionTitle: { ...typography.bodyMedium, color: colors.textPrimary },
    body: { ...typography.body, color: colors.textSecondary },
});

export default MealDetailSheet;
