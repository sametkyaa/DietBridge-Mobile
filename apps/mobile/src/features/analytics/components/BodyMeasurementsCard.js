import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, EmptyState } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

export function BodyMeasurementsCard({ measurements, onEdit, onHistory }) {
    return (
        <AppCard>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.heading} accessibilityRole="header">Vücut ölçüleri</Text>
                </View>
                <AppButton variant="text" label="Düzenle" onPress={onEdit} />
            </View>
            {measurements.length === 0 ? (
                <EmptyState icon="target" title="Ölçüm bulunmuyor" description="Vücut çevresi ölçülerinizi ekleyebilirsiniz." />
            ) : (
                <View style={styles.grid}>
                    {measurements.map((measurement, index) => (
                        <View key={measurement.label} style={[styles.item, index % 2 === 1 && styles.itemRight, index > 1 && styles.itemLower]}>
                            <Text style={styles.label}>{measurement.label}{measurement.detail ? ` (${measurement.detail})` : ''}</Text>
                            <Text style={styles.value}>{measurement.value} <Text style={styles.unit}>{measurement.unit}</Text></Text>
                        </View>
                    ))}
                </View>
            )}
            <AppButton variant="secondary" label="Ölçüm geçmişini gör" onPress={onHistory} style={styles.historyButton} />
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.x2 },
    titleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    heading: { ...typography.sectionTitle, color: colors.textPrimary },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.x2 },
    item: { width: '50%', paddingVertical: spacing.x3, paddingRight: spacing.x3 },
    itemRight: { paddingLeft: spacing.x4, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderStrong },
    itemLower: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    label: { ...typography.supporting, color: colors.textSecondary },
    value: { ...typography.numeric, fontSize: 24, lineHeight: 30, color: colors.textPrimary, marginTop: 2 },
    unit: { ...typography.supporting, letterSpacing: 0, color: colors.textTertiary },
    historyButton: { marginTop: spacing.x3 },
});

export default BodyMeasurementsCard;
