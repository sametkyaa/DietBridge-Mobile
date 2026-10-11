import React from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import DietitianConnectionRequestCard from '../../dietitianConnection/components/DietitianConnectionRequestCard';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { useDietitianInviteViewModel } from '../../dietitianConnection/viewmodels/useDietitianInviteViewModel';
import OnboardingStepLayout from './OnboardingStepLayout';

const SHARED_ITEMS = ['Öğün planını hazırlar ve günceller', 'Kilo ve su kayıtlarını görür', 'Seninle mesajlaşır'];

const getInitials = (name) => String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('tr-TR'))
    .join('') || 'D';

function DietitianSummary({ name, title, avatarUrl, children }) {
    return (
        <View style={styles.dietitianCard}>
            <View style={styles.dietitianRow}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} accessibilityLabel="Diyetisyen profil fotoğrafı" />
                ) : (
                    <View style={styles.avatar}><Text style={styles.initials}>{getInitials(name)}</Text></View>
                )}
                <View style={styles.dietitianText}>
                    <Text style={styles.dietitianName}>{name}</Text>
                    {title ? <Text style={styles.dietitianTitle}>{title}</Text> : null}
                </View>
            </View>
            {children}
        </View>
    );
}

function OnboardingConnectStep({ userId, onContinue }) {
    const {
        hasActiveDietitian,
        activeDietitian,
        pendingRequest,
        connectionAction,
        connectionError,
        approvePendingRequest,
        rejectPendingRequest,
    } = useDietitianConnection();
    const invite = useDietitianInviteViewModel({ initialCode: '', userId, onComplete: async () => {} });

    if (hasActiveDietitian) {
        const name = activeDietitian?.fullName || activeDietitian?.name || 'Diyetisyenin';
        return (
            <OnboardingStepLayout
                stepKey="connect-done"
                title="Diyetisyenine bağlandın"
                description="Planın hazır olduğunda ana sayfada göreceksin. Şimdi seni biraz tanıyalım."
                footer={<AppButton label="Devam" onPress={onContinue} />}
            >
                <DietitianSummary name={name} avatarUrl={activeDietitian?.avatarUrl}>
                    <InlineAlert variant="success" message="Bağlantı tamamlandı." />
                </DietitianSummary>
            </OnboardingStepLayout>
        );
    }

    if (pendingRequest) {
        return (
            <OnboardingStepLayout
                stepKey="connect-request"
                title="Diyetisyenin seni bekliyor"
                description="Bir diyetisyen sana bağlantı isteği gönderdi. Kabul ettiğinde planın ve sohbetin açılır."
                footer={<AppButton label="Daha sonra karar ver" variant="secondary" onPress={onContinue} />}
            >
                <DietitianConnectionRequestCard
                    request={pendingRequest}
                    action={connectionAction}
                    error={connectionError}
                    onApprove={() => approvePendingRequest(pendingRequest.id).catch(() => {})}
                    onReject={() => Alert.alert(
                        'Bağlantı isteğini reddet',
                        'Bu diyetisyenin bağlantı isteğini reddetmek istediğinize emin misiniz?',
                        [
                            { text: 'Vazgeç', style: 'cancel' },
                            { text: 'İsteği Reddet', style: 'destructive', onPress: () => rejectPendingRequest(pendingRequest.id).catch(() => {}) },
                        ],
                    )}
                />
            </OnboardingStepLayout>
        );
    }

    if (invite.profile) {
        return (
            <OnboardingStepLayout
                stepKey="connect-confirm"
                title="Bu diyetisyen senin mi?"
                description="Bağlandığında DietBridge'deki takip bilgilerin bu diyetisyenle paylaşılır."
                error={invite.completed ? null : invite.message}
                footer={(
                    <>
                        <AppButton label="Bağlan" onPress={invite.redeem} loading={invite.busy} disabled={invite.completed} />
                        <AppButton label="Bu benim diyetisyenim değil" variant="text" style={styles.centered} disabled={invite.busy} onPress={() => invite.changeCode('')} />
                    </>
                )}
            >
                <DietitianSummary name={invite.profile.name} title={invite.profile.title} avatarUrl={invite.profile.avatarUrl}>
                    <View style={styles.sharedList}>
                        {SHARED_ITEMS.map((item) => (
                            <View key={item} style={styles.sharedRow}>
                                <Icon name="check" size={16} color={colors.primary} />
                                <Text style={styles.sharedText}>{item}</Text>
                            </View>
                        ))}
                    </View>
                </DietitianSummary>
            </OnboardingStepLayout>
        );
    }

    return (
        <OnboardingStepLayout
            stepKey="connect-code"
            title="Diyetisyenine bağlan"
            description="Diyetisyeninin sana verdiği kodu gir. Planın ve sohbet bağlantıdan sonra açılır."
            error={invite.message}
            footer={<AppButton label="Kodu kontrol et" onPress={invite.preview} loading={invite.busy} disabled={!invite.code.trim()} />}
        >
            <AppInput
                label="Diyetisyen kodu"
                value={invite.code}
                onChangeText={invite.changeCode}
                placeholder="DB…"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={64}
                editable={!invite.busy}
                returnKeyType="done"
                onSubmitEditing={invite.code.trim() ? invite.preview : undefined}
            />
            <View style={styles.hint}>
                <Icon name="info" size={18} color={colors.textSecondary} />
                <Text style={styles.hintText}>Kodun yok mu? Diyetisyeninden iste ya da sana gönderdiği davet bağlantısına dokun. Bu adımı şimdilik atlayabilirsin.</Text>
            </View>
        </OnboardingStepLayout>
    );
}

const styles = StyleSheet.create({
    dietitianCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.x5, gap: spacing.x4 },
    dietitianRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: radius.round,
        backgroundColor: colors.tealSoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: { ...typography.sectionTitle, color: colors.tealDark },
    dietitianText: { flex: 1, minWidth: 0 },
    dietitianName: { ...typography.cardTitle, color: colors.textPrimary },
    dietitianTitle: { ...typography.supporting, color: colors.textSecondary },
    sharedList: { gap: spacing.x2, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: spacing.x3 },
    sharedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    sharedText: { ...typography.supporting, color: colors.textPrimary },
    hint: {
        flexDirection: 'row',
        gap: spacing.x3,
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.control,
        padding: spacing.x4,
    },
    hintText: { ...typography.supporting, color: colors.textSecondary, flex: 1 },
    centered: { alignSelf: 'center' },
});

export default OnboardingConnectStep;
