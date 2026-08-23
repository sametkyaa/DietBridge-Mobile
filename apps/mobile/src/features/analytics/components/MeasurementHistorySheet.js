import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { BottomSheetView, EmptyState, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

const formatDate = (value) => {
    const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? `${value}T12:00:00Z` : value;
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? 'Tarih bilinmiyor' : date.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
    });
};

export function MeasurementHistorySheet({ visible, history, status, onClose, bottomInset }) {
    return (
        <BottomSheetView visible={visible} onClose={onClose} title="Ölçüm geçmişi" scrollable bottomInset={bottomInset}>
            {status === 'loading' ? (
                <View style={styles.state} accessibilityRole="progressbar" accessibilityLabel="Ölçüm geçmişi yükleniyor" accessibilityState={{ busy: true }}>
                    <ActivityIndicator color={colors.primaryDark} />
                    <Text style={styles.supporting}>Ölçüm geçmişi yükleniyor...</Text>
                </View>
            ) : status === 'error' ? (
                <InlineAlert variant="error" title="Ölçüm geçmişi yüklenemedi" message="Lütfen daha sonra tekrar deneyin." />
            ) : status === 'empty' ? (
                <EmptyState icon="target" title="Ölçüm geçmişi bulunmuyor" description="Kaydedilen ölçüler burada listelenecek." />
            ) : history.map((record) => (
                <View key={record.id || record.measuredAt} style={styles.record}>
                    <Text style={styles.date}>{formatDate(record.measuredAt)}</Text>
                    <View style={styles.values}>
                        {record.values.map((item) => (
                            <View key={item.label} style={styles.valueRow}>
                                <Text style={styles.label}>{item.label}</Text>
                                <Text style={styles.value}>{item.value} cm</Text>
                            </View>
                        ))}
                    </View>
                </View>
            ))}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    state: { minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: spacing.x2 },
    supporting: { ...typography.supporting, color: colors.textSecondary },
    record: { gap: spacing.x2, borderRadius: radius.control, backgroundColor: colors.surfaceMuted, padding: spacing.x3 },
    date: { ...typography.bodyMedium, color: colors.textPrimary },
    values: { gap: spacing.x1 },
    valueRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.x3 },
    label: { ...typography.supporting, color: colors.textSecondary, flex: 1 },
    value: { ...typography.supporting, color: colors.textPrimary },
});

export default MeasurementHistorySheet;
