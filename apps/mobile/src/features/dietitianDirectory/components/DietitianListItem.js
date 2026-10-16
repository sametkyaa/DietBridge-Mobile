import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, Icon } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { DietitianAvatar } from './DietitianAvatar';

export function DietitianListItem({ dietitian, onPress }) {
    const specialization = dietitian.specializations.join(', ');
    const experience = dietitian.experienceYears !== null ? `${dietitian.experienceYears} yıl deneyim` : null;
    return (
        <AppCard
            onPress={onPress}
            accessibilityLabel={`${dietitian.name}${specialization ? `, ${specialization}` : ''}. Profili görüntüle`}
            contentStyle={styles.row}
        >
            <DietitianAvatar name={dietitian.name} avatarUrl={dietitian.avatarUrl} />
            <View style={styles.text}>
                <Text style={styles.name} numberOfLines={1}>{dietitian.name}</Text>
                {specialization ? <Text style={styles.specialization} numberOfLines={2}>{specialization}</Text> : null}
                {experience ? <Text style={styles.meta}>{experience}</Text> : null}
            </View>
            <Icon name="chevronRight" size={20} color={colors.textTertiary} />
        </AppCard>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    text: { flex: 1, minWidth: 0, gap: 2 },
    name: { ...typography.cardTitle, color: colors.textPrimary },
    specialization: { ...typography.supporting, color: colors.textSecondary },
    meta: { ...typography.caption, color: colors.textTertiary },
});

export default DietitianListItem;
