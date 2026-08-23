import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard, AppScreen, ErrorState, Icon, StatusBadge } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import {
    formatAppointmentDate,
    formatAppointmentDuration,
    getAppointmentBadgeStatus,
    getAppointmentStatusLabel,
} from '../utils/appointmentContract.cjs';

function DetailHeader({ navigation }) {
    return (
        <View style={styles.header}>
            <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Geri"
                hitSlop={4}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
                <Icon name="back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text accessibilityRole="header" style={styles.headerTitle}>Randevu Detayı</Text>
            <View style={styles.headerBalance} accessible={false} />
        </View>
    );
}

function DetailRow({ icon, label, value }) {
    if (!value) return null;

    return (
        <View style={styles.detailRow}>
            <View style={styles.rowLabel}>
                <Icon name={icon} size={18} color={colors.primaryDark} />
                <Text style={styles.label}>{label}</Text>
            </View>
            <Text style={styles.value}>{value}</Text>
        </View>
    );
}

export default function AppointmentDetailScreen({ navigation, route }) {
    const appointment = route.params?.appointment || null;
    const displayStatus = appointment?.displayStatus || appointment?.status;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <AppScreen
                scroll
                header={<DetailHeader navigation={navigation} />}
                contentStyle={styles.content}
            >
                {appointment ? (
                    <AppCard contentStyle={styles.cardContent}>
                        <View style={styles.titleBlock}>
                            <Text style={styles.title}>{appointment.title}</Text>
                            <StatusBadge
                                status={getAppointmentBadgeStatus(displayStatus)}
                                label={getAppointmentStatusLabel(displayStatus)}
                            />
                        </View>
                        <View style={styles.rows}>
                            <DetailRow icon="calendar" label="Tarih" value={formatAppointmentDate(appointment.date)} />
                            <DetailRow icon="clock" label="Saat" value={appointment.time} />
                            <DetailRow icon="message" label="Randevu türü" value={appointment.type} />
                            <DetailRow icon="clock" label="Süre" value={formatAppointmentDuration(appointment.duration)} />
                        </View>
                    </AppCard>
                ) : (
                    <ErrorState
                        title="Randevu detayı bulunamadı"
                        description="Bu randevu bilgisi artık kullanılamıyor."
                        onRetry={() => navigation.goBack()}
                        retryLabel="Geri dön"
                    />
                )}
            </AppScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.x3,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
        backgroundColor: colors.surface,
    },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
    headerBalance: { width: 44, height: 44 },
    content: { paddingTop: spacing.x4, flexGrow: 1 },
    cardContent: { gap: spacing.x4 },
    titleBlock: { gap: spacing.x3 },
    title: { ...typography.screenTitle, color: colors.textPrimary },
    rows: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
    detailRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
    rowLabel: { width: 112, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    label: { ...typography.supporting, color: colors.textSecondary },
    value: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1, textAlign: 'right' },
    pressed: { opacity: 0.7 },
});
