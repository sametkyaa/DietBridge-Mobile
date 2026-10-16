import { Alert } from '../../../shared/utils/errorAlert';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Icon } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

// Shows the client's one pending connection request and lets them cancel it.
export function ConnectionRequestStatusCard({ dietitianName, isCancelling, onCancel, onOpenProfile }) {
    const name = dietitianName || 'Diyetisyen';
    const confirmCancel = () => Alert.alert(
        'Bağlanma isteğini iptal et',
        `${name} için gönderdiğin bağlanma isteği iptal edilsin mi?`,
        [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'İsteği iptal et', style: 'destructive', onPress: onCancel },
        ],
    );
    return (
        <AppCard>
            <View style={styles.header}>
                <Icon name="hourglass" size={20} color={colors.primaryDark} />
                <Text style={styles.title}>Bağlanma isteğin bekliyor</Text>
            </View>
            <Text style={styles.description}>
                {name} isteğini yanıtladığında burada göreceksin. Kabul edilirse uygulamanın tamamı açılır.
            </Text>
            <View style={styles.actions}>
                {onOpenProfile ? <AppButton variant="secondary" label="Profili gör" onPress={onOpenProfile} disabled={isCancelling} style={styles.action} /> : null}
                <AppButton variant="secondary" label="İsteği iptal et" onPress={confirmCancel} loading={isCancelling} disabled={isCancelling} style={styles.action} />
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    description: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
    actions: { flexDirection: 'row', gap: spacing.x2, marginTop: spacing.x4 },
    action: { flex: 1 },
});

export default ConnectionRequestStatusCard;
