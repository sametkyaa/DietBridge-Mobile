import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppSkeleton, EmptyState, Icon, InlineAlert } from '../../../../shared/components/ui';
import { colors, radius, shadows, spacing, typography } from '../../../../shared/theme';
import { MealPhotoThumbnail } from '../../../meals/components/MealPhotoThumbnail';
import { formatMealType } from '../../../../shared/utils/mealType';

const isFiniteValue = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

function MealFacts({ meal }) {
    const facts = [
        isFiniteValue(meal.calories) ? { value: Math.round(Number(meal.calories)), unit: 'kcal' } : null,
        isFiniteValue(meal.protein) ? { value: Math.round(meal.protein), unit: 'g protein' } : null,
        isFiniteValue(meal.carbohydrate) ? { value: Math.round(meal.carbohydrate), unit: 'g karb.' } : null,
    ].filter(Boolean);
    if (facts.length === 0) return null;

    return (
        <View style={styles.facts}>
            {facts.map((fact) => (
                <Text key={fact.unit} style={styles.fact}>
                    <Text style={styles.factValue}>{fact.value}</Text> {fact.unit}
                </Text>
            ))}
        </View>
    );
}

export function NextMealCard({
    meal,
    status,
    error,
    unlinkedMessage,
    isUpdating,
    onToggle,
    onDetail,
    onRetry,
    onNextMeal,
    hasNextMeal,
    completionButtonRef,
}) {
    const loading = status === 'loading' || status === 'retrying';

    if (loading || status === 'error' || status === 'unlinked' || !meal) {
        return (
            <AppCard>
                <Text style={styles.sectionTitle} accessibilityRole="header">Sıradaki öğün</Text>
                {loading ? (
                    <View
                        style={styles.loading}
                        accessible
                        accessibilityRole="progressbar"
                        accessibilityLabel={status === 'retrying' ? 'Beslenme planı yeniden yükleniyor' : 'Beslenme planı yükleniyor'}
                        accessibilityState={{ busy: true }}
                        accessibilityLiveRegion="polite"
                    >
                        <AppSkeleton width={56} height={56} borderRadius={radius.control} animated />
                        <View style={styles.loadingText}>
                            <AppSkeleton width="55%" height={16} animated />
                            <AppSkeleton width="80%" height={12} animated />
                            <Text style={styles.loadingLabel}>
                                {status === 'retrying' ? 'Beslenme planı yeniden yükleniyor...' : 'Beslenme planı yükleniyor...'}
                            </Text>
                        </View>
                    </View>
                ) : status === 'error' ? (
                    <View style={styles.stateWrap}>
                        <InlineAlert variant="error" title="Plan yüklenemedi" message={error} />
                        <AppButton variant="secondary" label="Tekrar dene" onPress={onRetry} />
                    </View>
                ) : status === 'unlinked' ? (
                    <InlineAlert variant="warning" title="Diyetisyen bağlantısı gerekli" message={unlinkedMessage} style={styles.stateWrap} />
                ) : (
                    <EmptyState
                        icon="meal"
                        title={status === 'empty' ? 'Bugün için plan bulunmuyor' : 'Bugünün öğünleri tamamlandı'}
                        description={status === 'empty' ? 'Diyetisyeniniz plan eklediğinde burada görebilirsiniz.' : 'Harika gidiyorsunuz.'}
                    />
                )}
            </AppCard>
        );
    }

    return (
        <View style={styles.hero}>
            <View style={styles.heroTop}>
                <Text style={styles.heroLabel} accessibilityRole="header">
                    {meal.isEaten ? 'Bu öğünü tamamladın' : 'Sıradaki öğün'}
                </Text>
                {onDetail ? (
                    <Pressable
                        onPress={onDetail}
                        accessibilityRole="button"
                        accessibilityLabel="Öğün ayrıntılarını aç"
                        hitSlop={8}
                        style={({ pressed }) => [styles.detailButton, pressed && styles.pressed]}
                    >
                        <Text style={styles.detailText}>Tarifi gör</Text>
                        <Icon name="chevronRight" size={18} color={colors.textOnPrimary} />
                    </Pressable>
                ) : null}
            </View>

            <View style={styles.mealRow}>
                <View style={styles.mealText}>
                    <Text style={styles.time}>
                        {meal.time}<Text style={styles.type}>   {formatMealType(meal.type)}</Text>
                    </Text>
                    <Text style={styles.title} numberOfLines={2}>{meal.title}</Text>
                </View>
                <MealPhotoThumbnail
                    photoPath={meal.photoPath}
                    completionPhotoPath={meal.completionPhotoPath}
                    localCompletionPhotoUri={meal.localCompletionPhotoUri}
                    imageStyle={styles.photo}
                    fallback={null}
                />
            </View>

            <MealFacts meal={meal} />

            <AppButton
                ref={completionButtonRef}
                label={meal.isEaten ? 'Geri al' : 'Öğünü yedim'}
                onPress={onToggle}
                loading={isUpdating}
                disabled={isUpdating}
                style={[styles.primaryAction, meal.isEaten && styles.undoAction]}
                textStyle={meal.isEaten ? styles.undoLabel : styles.primaryLabel}
                icon={meal.isEaten ? null : <Icon name="check" size={18} color={colors.textPrimary} />}
            />
            {meal.isEaten && hasNextMeal ? (
                <AppButton
                    variant="text"
                    label="Sonraki öğüne geç"
                    onPress={onNextMeal}
                    style={styles.nextAction}
                    textStyle={styles.nextLabel}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary },
    loading: { flexDirection: 'row', gap: spacing.x3, paddingTop: spacing.x4 },
    loadingText: { flex: 1, gap: spacing.x2 },
    loadingLabel: { ...typography.caption, color: colors.textSecondary },
    stateWrap: { gap: spacing.x3, marginTop: spacing.x3 },
    hero: {
        backgroundColor: colors.primaryDark,
        borderRadius: radius.hero,
        padding: spacing.x4,
        paddingTop: spacing.x2,
        ...shadows.hero,
    },
    heroTop: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    heroLabel: { ...typography.supporting, fontFamily: typography.bodyMedium.fontFamily, color: colors.primarySoft },
    detailButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 2 },
    detailText: { ...typography.supporting, fontFamily: typography.button.fontFamily, color: colors.textOnPrimary },
    mealRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x4, marginTop: spacing.x1 },
    mealText: { flex: 1, minWidth: 0 },
    time: { ...typography.numericSmall, color: colors.accent },
    type: { ...typography.supporting, color: colors.primarySoft },
    title: { ...typography.display, fontSize: 20, lineHeight: 26, letterSpacing: -0.3, color: colors.textOnPrimary, marginTop: spacing.x1 },
    photo: { width: 76, height: 76, borderRadius: radius.control },
    facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x4, marginTop: spacing.x3 },
    fact: { ...typography.supporting, color: colors.primarySoft },
    factValue: { fontFamily: typography.button.fontFamily, color: colors.textOnPrimary, fontVariant: ['tabular-nums'] },
    primaryAction: { minHeight: 48, marginTop: spacing.x4, backgroundColor: colors.accent },
    primaryLabel: { color: colors.textPrimary },
    undoAction: { backgroundColor: 'rgba(255,255,255,0.12)' },
    undoLabel: { color: colors.textOnPrimary },
    nextAction: { alignSelf: 'center', marginTop: spacing.x1 },
    nextLabel: { color: colors.accent },
    pressed: { opacity: 0.75 },
});

export default NextMealCard;
