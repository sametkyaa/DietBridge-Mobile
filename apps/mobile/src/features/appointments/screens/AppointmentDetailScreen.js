import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard, AppScreen, ErrorState, Icon, ScreenHeader, StatusBadge } from '../../../shared/components/ui';
import { colors, radius, shadows, spacing, typography } from '../../../shared/theme';
import {
    formatAppointmentDate,
    formatAppointmentDuration,
    getAppointmentBadgeStatus,
    getAppointmentStatusLabel,
} from '../utils/appointmentContract.cjs';

function DetailRow({ icon, label, value, isLast = false }) {
    if (!value) return null;

    return (
        <View style={[styles.detailRow, !isLast && styles.detailDivider]}>
            <View style={styles.rowIcon}>
                <Icon name={icon} size={18} color={colors.primaryDark} />
            </View>
            <Text style={styles.label}>{label}</Text>
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
                header={<ScreenHeader title="Randevu Detayı" onBack={() => navigation.goBack()} />}
                contentStyle={styles.content}
            >
                {appointment ? (
                    <>
                        <View style={styles.hero}>
                            <StatusBadge
                                status={getAppointmentBadgeStatus(displayStatus)}
                                label={getAppointmentStatusLabel(displayStatus)}
                            />
                            <Text style={styles.title}>{appointment.title}</Text>
                            <View style={styles.whenRow}>
                                <Text style={styles.heroTime}>{appointment.time}</Text>
                                <View style={styles.whenText}>
                                    <Text style={styles.heroDate}>{formatAppointmentDate(appointment.date)}</Text>
                                    <Text style={styles.heroWeekday}>
                                        {formatAppointmentDate(appointment.date, { day: undefined, month: undefined, year: undefined, weekday: 'long' })}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.sectionTitle}>Görüşme bilgileri</Text>
                        <AppCard style={styles.rows}>
                            <DetailRow icon="calendar" label="Tarih" value={formatAppointmentDate(appointment.date)} />
                            <DetailRow icon="clock" label="Saat" value={appointment.time} />
                            <DetailRow icon="message" label="Randevu türü" value={appointment.type} />
                            <DetailRow icon="hourglass" label="Süre" value={formatAppointmentDuration(appointment.duration)} isLast />
                        </AppCard>
                    </>
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
    content: { flexGrow: 1 },
    hero: {
        gap: spacing.x3,
        padding: spacing.x6,
        borderRadius: radius.hero,
        backgroundColor: colors.surface,
        alignItems: 'flex-start',
        ...shadows.hero,
    },
    title: { ...typography.screenTitle, color: colors.textPrimary },
    whenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4, marginTop: spacing.x2 },
    heroTime: { ...typography.numeric, fontSize: 40, lineHeight: 44, color: colors.primaryDark },
    whenText: { flex: 1, minWidth: 0, paddingLeft: spacing.x4, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.borderStrong },
    heroDate: { ...typography.bodyMedium, color: colors.textPrimary },
    heroWeekday: { ...typography.supporting, color: colors.textSecondary, textTransform: 'capitalize' },
    sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginTop: spacing.x8, marginBottom: spacing.x3 },
    rows: { paddingVertical: spacing.x1 },
    detailRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    detailDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    rowIcon: { width: 32, height: 32, borderRadius: radius.round, backgroundColor: colors.primarySurface, alignItems: 'center', justifyContent: 'center' },
    label: { ...typography.supporting, color: colors.textSecondary, flex: 1 },
    value: { ...typography.bodyMedium, color: colors.textPrimary, textAlign: 'right' },
});
