import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

const getDietitianName = (request) => String(request?.dietitian?.fullName || request?.dietitian?.name || '').trim() || 'Diyetisyeniniz';

export function DietitianConnectionRequestCard({ request, action, error, onApprove, onReject }) {
    if (!request) return null;
    const dietitianName = getDietitianName(request);
    const isBusy = action === 'approving' || action === 'rejecting';
    return (
        <AppCard>
            <View style={styles.header}><Icon name="person" size={22} color={colors.primaryDark} /><Text style={styles.title}>Diyetisyen bağlantı isteği</Text></View>
            <Text style={styles.description}>{dietitianName} sizinle DietBridge üzerinden bağlantı kurmak istiyor.</Text>
            <Text style={styles.supporting}>Bağlantıyı kabul ettiğinizde beslenme planlarınızı ve ilerleme durumunuzu yönetebilir.</Text>
            {error ? <InlineAlert variant="error" message={error} style={styles.alert} /> : null}
            <View style={styles.actions}>
                <AppButton variant="secondary" label="Reddet" onPress={onReject} disabled={isBusy} loading={action === 'rejecting'} accessibilityLabel="Diyetisyen bağlantı isteğini reddet" style={styles.action} />
                <AppButton label="Bağlantıyı Kabul Et" onPress={onApprove} disabled={isBusy} loading={action === 'approving'} accessibilityLabel="Diyetisyen bağlantı isteğini kabul et" style={styles.action} />
            </View>
        </AppCard>
    );
}

export default DietitianConnectionRequestCard;

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    description: { ...typography.body, color: colors.textPrimary, marginTop: spacing.x3 },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
    alert: { marginTop: spacing.x3 },
    actions: { flexDirection: 'row', gap: spacing.x2, marginTop: spacing.x4 },
    action: { flex: 1 },
});
