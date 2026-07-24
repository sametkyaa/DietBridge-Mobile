import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, EmptyState, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

export function BadgesCard({ badges }) {
    return (
        <AppCard>
            <Text style={styles.heading} accessibilityRole="header">Kazanılan rozetler</Text>
            {badges.length === 0 ? (
                <EmptyState icon="sprout" title="Henüz kazanılmış rozet yok" description="Rozet verisi kullanıma açıldığında başarılarınız burada görünür." />
            ) : (
                <View style={styles.grid}>
                    {badges.map((badge) => (
                        <View key={badge.id || badge.label} style={styles.badge}>
                            <View style={styles.iconWrap}><Icon name={badge.icon || 'sprout'} size={22} color={colors.primaryDark} /></View>
                            <Text style={styles.label}>{badge.label}</Text>
                        </View>
                    ))}
                </View>
            )}
        </AppCard>
    );
}

const styles = StyleSheet.create({
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x3 },
    badge: { minWidth: 112, flexGrow: 1, flexBasis: '30%', borderRadius: radius.control, backgroundColor: colors.primarySurface, padding: spacing.x3, alignItems: 'center', gap: spacing.x2 },
    iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
    label: { ...typography.supporting, color: colors.textPrimary, textAlign: 'center' },
});

export default BadgesCard;
