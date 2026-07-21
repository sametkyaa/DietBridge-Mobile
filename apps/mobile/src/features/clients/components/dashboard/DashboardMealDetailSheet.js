import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomSheetView, Icon, StatusBadge } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { MealPhotoThumbnail } from '../../../meals/components/MealPhotoThumbnail';

export function DashboardMealDetailSheet({ meal, visible, onClose, bottomInset }) {
    if (!meal) return null;

    const macros = [
        { label: 'Kalori', value: meal.calories === null ? '—' : `${meal.calories} kcal` },
        { label: 'Protein', value: `${Math.round(meal.protein)} g` },
        { label: 'Karbonhidrat', value: `${Math.round(meal.carbohydrate)} g` },
        { label: 'Yağ', value: `${Math.round(meal.fat)} g` },
    ];

    return (
        <BottomSheetView visible={visible} onClose={onClose} title="Öğün detayı" scrollable bottomInset={bottomInset}>
            <View style={styles.metaRow}>
                <Text style={styles.meta}>{meal.time} · {meal.type}</Text>
                <StatusBadge status={meal.status} label={meal.badgeLabel} />
            </View>
            <Text style={styles.title}>{meal.title}</Text>
            <MealPhotoThumbnail
                photoPath={meal.photoPath}
                completionPhotoUri={meal.completionPhotoUri}
                imageStyle={styles.photo}
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
                    <Text style={styles.sectionTitle}>Diyetisyen notu</Text>
                    <Text style={styles.body}>{meal.note}</Text>
                </View>
            ) : null}
            {meal.ingredients.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Malzemeler</Text>
                    {meal.ingredients.map((item) => <Text key={item} style={styles.body}>• {item}</Text>)}
                </View>
            ) : null}
            {meal.steps.length > 0 ? (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hazırlanış</Text>
                    {meal.steps.map((step, index) => <Text key={`${index}-${step}`} style={styles.body}>{index + 1}. {step}</Text>)}
                </View>
            ) : null}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    meta: { ...typography.supporting, color: colors.textSecondary },
    title: { ...typography.sectionTitle, color: colors.textPrimary },
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

export default DashboardMealDetailSheet;
