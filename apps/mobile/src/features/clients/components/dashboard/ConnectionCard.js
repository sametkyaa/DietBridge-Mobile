import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Icon, InlineAlert, StatusBadge } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

function DietitianDetails({ dietitian }) {
    if (!dietitian) return null;
    const details = [
        dietitian.specialization ? `Uzmanlık: ${dietitian.specialization}` : null,
        dietitian.university ? `Okul: ${dietitian.university}` : null,
        dietitian.experienceYears !== null && dietitian.experienceYears !== undefined
            ? `Deneyim: ${dietitian.experienceYears} yıl`
            : null,
        dietitian.bio || null,
    ].filter(Boolean);

    return (
        <View style={styles.details}>
            <Text style={styles.name}>{dietitian.name}</Text>
            {dietitian.email ? <Text style={styles.meta}>{dietitian.email}</Text> : null}
            {details.map((detail) => <Text key={detail} style={styles.meta}>{detail}</Text>)}
        </View>
    );
}

export function ConnectionCard({
    isLoading,
    activeDietitian,
    pendingRequest,
    action,
    error,
    onApprove,
    onReject,
}) {
    if (isLoading && !pendingRequest && !activeDietitian) {
        return (
            <AppCard>
                <View
                    style={styles.loadingRow}
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel="Diyetisyen bağlantı durumu kontrol ediliyor"
                    accessibilityState={{ busy: true }}
                    accessibilityLiveRegion="polite"
                >
                    <ActivityIndicator color={colors.primaryDark} />
                    <Text style={styles.meta}>Bağlantı durumu kontrol ediliyor...</Text>
                </View>
            </AppCard>
        );
    }

    if (pendingRequest) {
        return (
            <AppCard>
                <View style={styles.header}>
                    <Icon name="person" size={22} color={colors.primaryDark} />
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Diyetisyen bağlantı isteği</Text>
                        <Text style={styles.meta}>Bir diyetisyen sizinle çalışmak istiyor.</Text>
                    </View>
                    <StatusBadge status="waiting" label="Onay bekliyor" />
                </View>
                <DietitianDetails dietitian={pendingRequest.dietitian} />
                {error ? <InlineAlert variant="error" message={error} style={styles.alert} /> : null}
                <View style={styles.actions}>
                    <AppButton
                        variant="secondary"
                        label="Reddet"
                        onPress={onReject}
                        loading={action === 'reject'}
                        disabled={!!action}
                        style={styles.action}
                    />
                    <AppButton
                        label="Onayla"
                        onPress={onApprove}
                        loading={action === 'approve'}
                        disabled={!!action}
                        style={styles.action}
                    />
                </View>
            </AppCard>
        );
    }

    if (activeDietitian) {
        return (
            <AppCard>
                <View style={styles.header}>
                    <Icon name="person" size={22} color={colors.primaryDark} />
                    <View style={styles.headerText}>
                        <Text style={styles.title}>{activeDietitian.name}</Text>
                        <Text style={styles.meta}>Diyetisyeninizle bağlantınız aktif.</Text>
                    </View>
                    <StatusBadge status="connected" />
                </View>
                {error ? <InlineAlert variant="error" message={error} style={styles.alert} /> : null}
            </AppCard>
        );
    }

    if (error) return <InlineAlert variant="error" title="Bağlantı durumu alınamadı" message={error} />;
    return null;
}

const styles = StyleSheet.create({
    loadingRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
    headerText: { flex: 1, minWidth: 0 },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    meta: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    details: { marginTop: spacing.x3, padding: spacing.x3, backgroundColor: colors.surfaceMuted, borderRadius: 12 },
    name: { ...typography.bodyMedium, color: colors.textPrimary },
    alert: { marginTop: spacing.x3 },
    actions: { flexDirection: 'row', gap: spacing.x2, marginTop: spacing.x4 },
    action: { flex: 1 },
});

export default ConnectionCard;
