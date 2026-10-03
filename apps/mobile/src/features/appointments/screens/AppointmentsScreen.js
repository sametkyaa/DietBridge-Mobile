import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppCard,
    AppScreen,
    EmptyState,
    ErrorState,
    Icon,
    ScreenHeader,
    SegmentedTabs,
    StatusBadge,
} from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import {
    formatAppointmentDate,
    formatAppointmentDuration,
    getAppointmentBadgeStatus,
    getAppointmentStatusLabel,
} from '../utils/appointmentContract.cjs';
import { useAppointmentsViewModel } from '../viewmodels/useAppointmentsViewModel';

const TABS = [
    { key: 'upcoming', label: 'Yaklaşan' },
    { key: 'past', label: 'Geçmiş' },
];

// A calendar tile carries the date so the row itself can stay calm: title,
// then time and format on one quiet line.
function AppointmentCard({ appointment, onPress }) {
    const durationLabel = formatAppointmentDuration(appointment.duration);
    const displayStatus = appointment.displayStatus || appointment.status;
    const day = formatAppointmentDate(appointment.date, { day: 'numeric', month: undefined, year: undefined });
    const month = formatAppointmentDate(appointment.date, { day: undefined, month: 'long', year: undefined });
    const weekday = formatAppointmentDate(appointment.date, { day: undefined, month: undefined, year: undefined, weekday: 'long' });

    return (
        <AppCard
            onPress={onPress}
            accessibilityLabel={`Randevu detayını aç: ${appointment.title}`}
            contentStyle={styles.cardContent}
        >
            <View style={styles.dateTile}>
                <Text style={styles.dateDay}>{day}</Text>
                <Text style={styles.dateMonth}>{month}</Text>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>{appointment.title}</Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                    <Text style={styles.cardTime}>{appointment.time}</Text>
                    {weekday ? `  ${weekday}` : ''}
                </Text>
                <Text style={styles.cardType}>
                    {[appointment.type, durationLabel].filter(Boolean).join(', ')}
                </Text>
                <StatusBadge
                    status={getAppointmentBadgeStatus(displayStatus)}
                    label={getAppointmentStatusLabel(displayStatus)}
                    style={styles.badge}
                />
            </View>
            <Icon name="chevronRight" size={16} color={colors.textTertiary} />
        </AppCard>
    );
}

function AppointmentList({ appointments, navigation }) {
    return (
        <View style={styles.list}>
            {appointments.map((appointment) => (
                <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onPress={() => navigation.navigate('AppointmentDetail', { appointment })}
                />
            ))}
        </View>
    );
}

export default function AppointmentsScreen({ navigation }) {
    const [selectedTab, setSelectedTab] = useState('upcoming');
    const {
        upcomingAppointments,
        pastAppointments,
        status,
        error,
        isLoading,
        refreshClassification,
        retryAppointments,
    } = useAppointmentsViewModel();
    const appointments = selectedTab === 'upcoming' ? upcomingAppointments : pastAppointments;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <AppScreen
                scroll
                header={(
                    <ScreenHeader
                        title="Randevularım"
                        subtitle="Diyetisyeninle planlanan görüşmeler"
                        onBack={() => navigation.goBack()}
                    />
                )}
                contentStyle={styles.content}
            >
                <SegmentedTabs
                    tabs={TABS}
                    selectedKey={selectedTab}
                    onChange={(key) => {
                        refreshClassification();
                        setSelectedTab(key);
                    }}
                />

                {isLoading ? (
                    <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Randevular yükleniyor" accessibilityState={{ busy: true }}>
                        <ActivityIndicator size="small" color={colors.primaryDark} />
                        <Text style={styles.stateText}>Randevular yükleniyor...</Text>
                    </View>
                ) : null}

                {status === 'error' ? (
                    <ErrorState
                        title="Randevular yüklenemedi"
                        description={error || 'Randevu bilgileri şu anda alınamıyor.'}
                        onRetry={retryAppointments}
                    />
                ) : null}

                {status === 'success' && appointments.length > 0 ? (
                    <AppointmentList appointments={appointments} navigation={navigation} />
                ) : null}

                {status === 'empty' || (status === 'success' && appointments.length === 0) ? (
                    <EmptyState
                        icon="calendar"
                        title={selectedTab === 'upcoming' ? 'Yaklaşan randevunuz yok' : 'Geçmiş randevunuz yok'}
                        description={selectedTab === 'upcoming'
                            ? 'Planlanan bir randevunuz olduğunda burada görünecek.'
                            : 'Tamamlanan veya iptal edilen randevularınız burada görünecek.'}
                    />
                ) : null}
            </AppScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { gap: spacing.x4 },
    loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x10, gap: spacing.x2 },
    stateText: { ...typography.supporting, color: colors.textSecondary },
    list: { gap: spacing.x3 },
    cardContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
    dateTile: {
        width: 64,
        paddingVertical: spacing.x3,
        borderRadius: radius.control,
        backgroundColor: colors.primarySurface,
        alignItems: 'center',
    },
    dateDay: { ...typography.numeric, fontSize: 24, lineHeight: 28, color: colors.primaryDark },
    dateMonth: { ...typography.caption, color: colors.primaryDark, textTransform: 'capitalize' },
    cardBody: { flex: 1, minWidth: 0, gap: spacing.x1 },
    cardTitle: { ...typography.cardTitle, color: colors.textPrimary },
    cardMeta: { ...typography.supporting, color: colors.textSecondary, textTransform: 'capitalize' },
    cardTime: { ...typography.numericSmall, color: colors.textPrimary },
    cardType: { ...typography.caption, color: colors.textTertiary },
    badge: { alignSelf: 'flex-start', marginTop: spacing.x1 },
});
