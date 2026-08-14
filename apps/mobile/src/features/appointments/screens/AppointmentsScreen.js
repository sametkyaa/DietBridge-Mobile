import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppCard, AppScreen, EmptyState, ErrorState, Icon, StatusBadge } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
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

function ScreenHeader({ navigation, title }) {
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
            <Text accessibilityRole="header" style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerBalance} accessible={false} />
        </View>
    );
}

function AppointmentCard({ appointment, onPress }) {
    const durationLabel = formatAppointmentDuration(appointment.duration);
    const metadata = [appointment.type, durationLabel].filter(Boolean).join(' • ');

    return (
        <AppCard
            onPress={onPress}
            accessibilityLabel={`Randevu detayını aç: ${appointment.title}`}
            style={styles.appointmentCard}
            contentStyle={styles.cardContent}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>{appointment.title}</Text>
                <StatusBadge
                    status={getAppointmentBadgeStatus(appointment.status)}
                    label={getAppointmentStatusLabel(appointment.status)}
                />
            </View>
            <View style={styles.detailLine}>
                <Icon name="calendar" size={17} color={colors.primaryDark} />
                <Text style={styles.detailText}>{formatAppointmentDate(appointment.date)}</Text>
            </View>
            <View style={styles.detailLine}>
                <Icon name="clock" size={17} color={colors.primaryDark} />
                <Text style={styles.detailText}>{appointment.time}</Text>
            </View>
            {metadata ? <Text style={styles.metadata}>{metadata}</Text> : null}
            <View style={styles.cardFooter}>
                <Text style={styles.detailLink}>Detayları görüntüle</Text>
                <Icon name="chevronRight" size={19} color={colors.textTertiary} />
            </View>
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
        retryAppointments,
    } = useAppointmentsViewModel();
    const appointments = selectedTab === 'upcoming' ? upcomingAppointments : pastAppointments;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <AppScreen
                scroll
                header={<ScreenHeader navigation={navigation} title="Randevularım" />}
                contentStyle={styles.content}
            >
                <View style={styles.tabs} accessibilityRole="tablist">
                    {TABS.map((tab) => (
                        <Pressable
                            key={tab.key}
                            onPress={() => setSelectedTab(tab.key)}
                            accessibilityRole="tab"
                            accessibilityLabel={tab.label}
                            accessibilityState={{ selected: selectedTab === tab.key }}
                            style={({ pressed }) => [
                                styles.tab,
                                selectedTab === tab.key && styles.selectedTab,
                                pressed && styles.pressed,
                            ]}
                        >
                            <Text style={[styles.tabLabel, selectedTab === tab.key && styles.selectedTabLabel]}>{tab.label}</Text>
                        </Pressable>
                    ))}
                </View>

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
    content: { paddingTop: spacing.x4, gap: spacing.x4 },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: 14,
        padding: spacing.x1,
    },
    tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
    selectedTab: { backgroundColor: colors.surface, elevation: 1 },
    tabLabel: { ...typography.bodyMedium, color: colors.textSecondary },
    selectedTabLabel: { color: colors.primaryDark },
    loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x10, gap: spacing.x2 },
    stateText: { ...typography.supporting, color: colors.textSecondary },
    list: { gap: spacing.x3 },
    appointmentCard: { padding: spacing.x4 },
    cardContent: { gap: spacing.x2 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2 },
    cardTitle: { ...typography.cardTitle, color: colors.textPrimary, flex: 1 },
    detailLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    detailText: { ...typography.body, color: colors.textSecondary },
    metadata: { ...typography.supporting, color: colors.textSecondary },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.x1, gap: spacing.x1 },
    detailLink: { ...typography.caption, color: colors.primaryDark },
    pressed: { opacity: 0.7 },
});
