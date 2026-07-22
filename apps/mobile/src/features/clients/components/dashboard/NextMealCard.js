import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppSkeleton, EmptyState, Icon, InlineAlert, StatusBadge } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';
import { MealPhotoThumbnail } from '../../../meals/components/MealPhotoThumbnail';

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

    return (
        <AppCard>
            <View style={styles.header}>
                <Text style={styles.sectionTitle} accessibilityRole="header">Sıradaki öğün</Text>
                {meal && onDetail ? <AppButton variant="text" label="Detay" onPress={onDetail} /> : null}
            </View>

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
                <InlineAlert variant="warning" title="Diyetisyen bağlantısı gerekli" message={unlinkedMessage} />
            ) : !meal ? (
                <EmptyState
                    icon="meal"
                    title={status === 'empty' ? 'Bugün için plan bulunmuyor' : 'Bugünün öğünleri tamamlandı'}
                    description={status === 'empty' ? 'Diyetisyeniniz plan eklediğinde burada görebilirsiniz.' : 'Harika gidiyorsunuz.'}
                />
            ) : (
                <>
                    <View style={styles.mealRow}>
                        <MealPhotoThumbnail
                            photoPath={meal.photoPath}
                            completionPhotoUri={meal.completionPhotoUri}
                            imageStyle={styles.photo}
                            fallback={(
                                <View style={styles.photoFallback}>
                                    <Icon name="meal" size={26} color={colors.primaryDark} />
                                </View>
                            )}
                        />
                        <View style={styles.mealText}>
                            <View style={styles.metaRow}>
                                <Text style={styles.time}>{meal.time}</Text>
                                <StatusBadge status={meal.status} label={meal.badgeLabel} />
                            </View>
                            <Text style={styles.title}>{meal.title}</Text>
                            {meal.description ? <Text style={styles.description}>{meal.description}</Text> : null}
                        </View>
                    </View>
                    <AppButton
                        ref={completionButtonRef}
                        label={meal.isEaten ? 'Geri al' : 'Öğünü yedim'}
                        variant={meal.isEaten ? 'secondary' : 'primary'}
                        onPress={onToggle}
                        loading={isUpdating}
                        disabled={isUpdating}
                        style={styles.primaryAction}
                    />
                    {meal.isEaten && hasNextMeal ? (
                        <AppButton variant="text" label="Sonraki öğüne geç" onPress={onNextMeal} style={styles.nextAction} />
                    ) : null}
                </>
            )}
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary },
    loading: { flexDirection: 'row', gap: spacing.x3, paddingVertical: spacing.x3 },
    loadingText: { flex: 1, gap: spacing.x2 },
    loadingLabel: { ...typography.caption, color: colors.textSecondary },
    stateWrap: { gap: spacing.x3 },
    mealRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, marginTop: spacing.x2 },
    photo: { width: 72, height: 72, borderRadius: radius.control },
    photoFallback: { width: 72, height: 72, borderRadius: radius.control, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    mealText: { flex: 1, minWidth: 0 },
    metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    time: { ...typography.caption, color: colors.textSecondary },
    title: { ...typography.cardTitle, color: colors.textPrimary, marginTop: spacing.x1 },
    description: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    primaryAction: { marginTop: spacing.x4 },
    nextAction: { alignSelf: 'center', marginTop: spacing.x1 },
});

export default NextMealCard;
