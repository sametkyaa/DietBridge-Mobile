import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, EmptyState, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

export function BodyMeasurementsCard({ measurements, onEdit }) {
    return (
        <AppCard>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Icon name="target" size={20} color={colors.primaryDark} />
                    <Text style={styles.heading} accessibilityRole="header">Vücut ölçüleri</Text>
                </View>
                <AppButton variant="text" label="Ölçüleri düzenle" onPress={onEdit} />
            </View>
            {measurements.length === 0 ? (
                <EmptyState icon="target" title="Ölçüm bulunmuyor" description="Bel, kalça veya kol ölçünüzü ekleyebilirsiniz." />
            ) : (
                <View style={styles.grid}>
                    {measurements.map((measurement) => (
                        <View key={measurement.label} style={styles.item}>
                            <Text style={styles.label}>{measurement.label}{measurement.detail ? ` · ${measurement.detail}` : ''}</Text>
                            <Text style={styles.value}>{measurement.value} <Text style={styles.unit}>{measurement.unit}</Text></Text>
                        </View>
                    ))}
                </View>
            )}
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    titleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x3 },
    item: { minWidth: 112, flexGrow: 1, flexBasis: '30%', borderRadius: radius.control, backgroundColor: colors.surfaceMuted, padding: spacing.x3 },
    label: { ...typography.caption, color: colors.textSecondary },
    value: { ...typography.cardTitle, color: colors.textPrimary, marginTop: spacing.x1 },
    unit: { ...typography.supporting, color: colors.textSecondary },
});

export default BodyMeasurementsCard;
