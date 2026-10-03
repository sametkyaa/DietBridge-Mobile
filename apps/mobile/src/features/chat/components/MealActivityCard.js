import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { Icon } from '../../../shared/components/ui';
import { formatMealType } from '../../../shared/utils/mealType';
import { MealPhotoPreviewModal } from '../../meals/components/plan/MealPhotoPreviewModal';
import { MealPhotoThumbnail } from '../../meals/components/MealPhotoThumbnail';
import { getMealActivityPhotoPath } from '../utils/mealActivityUtils';

const ISTANBUL_TIME_ZONE = 'Europe/Istanbul';

const formatCompletionTime = (value) => {
    if (typeof value !== 'string') return '';
    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) return '';
    return new Intl.DateTimeFormat('tr-TR', {
        timeZone: ISTANBUL_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
    }).format(timestamp);
};

export default function MealActivityCard({ activity }) {
    const [previewUri, setPreviewUri] = useState(null);
    const mealLabel = formatMealType(activity?.mealType);
    const completionTime = formatCompletionTime(activity?.completedAt);
    const photoPath = getMealActivityPhotoPath(activity);

    return (
        <View style={styles.row} accessibilityRole="summary" accessibilityLabel={`${mealLabel} tamamlandı öğün aktivitesi`}>
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <View style={styles.iconCircle} accessible={false}>
                        <Icon name="check" size={18} color={colors.textPrimary} />
                    </View>
                    <View style={styles.textWrap}>
                        <Text style={styles.heading}>{mealLabel} tamamlandı</Text>
                        <Text style={styles.title} numberOfLines={2}>{activity?.mealTitle}</Text>
                        <Text style={styles.meta}>Plan {activity?.mealTime}, işaretlendi {completionTime || '—'}</Text>
                    </View>
                </View>
                {photoPath ? (
                    <MealPhotoThumbnail
                        completionPhotoPath={activity.completionPhotoPath}
                        photoPath={activity.mealPhotoPath}
                        imageStyle={styles.photo}
                        wrapperStyle={styles.photoButton}
                        onPress={setPreviewUri}
                        accessibilityLabel={`${activity.mealTitle} öğün fotoğrafını aç`}
                        fallback={null}
                    />
                ) : null}
            </View>
            <MealPhotoPreviewModal uri={previewUri} onClose={() => setPreviewUri(null)} />
        </View>
    );
}

const styles = StyleSheet.create({
    row: { width: '100%', paddingHorizontal: spacing.x6, marginVertical: spacing.x3, alignItems: 'center' },
    card: { width: '100%', maxWidth: 420, borderRadius: radius.card, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, padding: spacing.x3 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
    textWrap: { flex: 1, minWidth: 0 },
    heading: { ...typography.caption, color: colors.primaryDark },
    title: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    meta: { ...typography.caption, fontVariant: ['tabular-nums'], color: colors.textTertiary, marginTop: 2 },
    photoButton: { marginTop: spacing.x3, alignSelf: 'flex-start', borderRadius: radius.small, overflow: 'hidden' },
    photo: { width: 120, height: 84, borderRadius: radius.small },
});
