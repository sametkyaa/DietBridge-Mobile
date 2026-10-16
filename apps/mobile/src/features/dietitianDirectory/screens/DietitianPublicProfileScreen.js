import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    AppButton,
    AppCard,
    AppInput,
    AppSkeleton,
    BottomSheetView,
    EmptyState,
    ErrorState,
    Icon,
    InlineAlert,
    ScreenHeader,
    StatusBadge,
} from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { openCheckedExternalLink } from '../../../shared/utils/externalLinking';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { useDietitianPublicProfileViewModel } from '../viewmodels/useDietitianPublicProfileViewModel';
import { CONNECTION_NOTE_MAX_LENGTH, INQUIRY_RESULT_MESSAGES, isAllowedSocialLink } from '../utils/directoryContract.cjs';
import { ConnectionRequestStatusCard } from '../components/ConnectionRequestStatusCard';
import { DietitianAvatar } from '../components/DietitianAvatar';

const InfoRow = ({ label, value }) => (value ? (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
) : null);

export default function DietitianPublicProfileScreen({ navigation, route }) {
    const dietitianId = route?.params?.dietitianId || null;
    const vm = useDietitianPublicProfileViewModel({ dietitianId, initialDietitian: route?.params?.dietitian || null });
    const connection = useDietitianConnection();
    const dietitian = vm.dietitian;

    const openChat = () => navigation.navigate('InquiryChat', {
        dietitianId,
        dietitianName: dietitian?.name,
        inquiryId: vm.inquiryState.inquiry?.id || null,
    });

    const renderMessageAction = () => {
        const { kind } = vm.inquiryState;
        if (kind === 'open') return <AppButton label="Mesajlara git" icon="message" onPress={openChat} />;
        if (kind === 'closed') return <AppButton label="Görüşmeyi gör" variant="secondary" icon="message" onPress={openChat} />;
        if (kind === 'limit') {
            return <InlineAlert variant="info" message={INQUIRY_RESULT_MESSAGES.limit_reached} />;
        }
        if (dietitian && !dietitian.isListed) return null;
        return <AppButton label="Mesaj gönder" icon="message" onPress={openChat} />;
    };

    const renderRequestAction = () => {
        if (connection.pendingRequest?.dietitian?.id === dietitianId) {
            return <InlineAlert variant="info" message="Bu diyetisyen sana bağlantı isteği gönderdi. Diyetisyenler sekmesinden kabul edebilirsin." />;
        }
        if (vm.requestState === 'pending_here') {
            return <ConnectionRequestStatusCard dietitianName={dietitian?.name} isCancelling={vm.isCancellingRequest} onCancel={vm.cancelRequest} />;
        }
        if (vm.requestState === 'pending_elsewhere') {
            return <InlineAlert variant="info" message="Başka bir diyetisyene bekleyen bağlanma isteğin var. Yeni istek göndermek için önce onu iptal et." />;
        }
        if (dietitian && !dietitian.isListed && vm.inquiryState.kind !== 'open') return null;
        return <AppButton label="Bağlanma isteği gönder" variant="secondary" icon="person" onPress={vm.openRequestSheet} />;
    };

    let content;
    if (vm.status === 'loading' && !dietitian) {
        content = (
            <View style={styles.content} accessibilityRole="progressbar" accessibilityLabel="Profil yükleniyor" accessibilityState={{ busy: true }}>
                <AppSkeleton height={160} animated />
                <AppSkeleton height={120} animated style={styles.gap} />
            </View>
        );
    } else if (vm.status === 'missing') {
        content = (
            <EmptyState
                icon="person"
                title="Profil bulunamadı"
                description="Bu diyetisyen artık listede görünmüyor."
                actionLabel="Listeye dön"
                onAction={() => navigation.goBack()}
                style={styles.content}
            />
        );
    } else if (vm.status === 'error' && !dietitian) {
        content = <ErrorState title="Profil yüklenemedi" description={vm.error} onRetry={vm.retry} style={styles.content} />;
    } else {
        const experience = dietitian.experienceYears !== null ? `${dietitian.experienceYears} yıl` : null;
        content = (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <AppCard contentStyle={styles.hero}>
                    <DietitianAvatar name={dietitian.name} avatarUrl={dietitian.avatarUrl} size={84} />
                    <Text style={styles.name} accessibilityRole="header">{dietitian.name}</Text>
                    {dietitian.specializations.length > 0 ? (
                        <View style={styles.chips}>
                            {dietitian.specializations.map((item) => <StatusBadge key={item} status="info" label={item} />)}
                        </View>
                    ) : null}
                </AppCard>

                {vm.requestMessage ? (
                    <InlineAlert variant={vm.requestMessage.variant} message={vm.requestMessage.text} onDismiss={vm.dismissRequestMessage} />
                ) : null}

                <View style={styles.actions}>
                    {renderMessageAction()}
                    {renderRequestAction()}
                </View>

                <AppCard>
                    <Text style={styles.sectionTitle}>Eğitim ve deneyim</Text>
                    <InfoRow label="Deneyim" value={experience} />
                    <InfoRow label="Üniversite" value={dietitian.university} />
                    <InfoRow label="Mezuniyet" value={dietitian.graduationYear ? String(dietitian.graduationYear) : null} />
                    {!experience && !dietitian.university ? <Text style={styles.muted}>Bilgi eklenmemiş.</Text> : null}
                </AppCard>

                <AppCard>
                    <Text style={styles.sectionTitle}>Hakkında</Text>
                    <Text style={styles.bio}>{dietitian.bio || 'Henüz bir biyografi eklenmemiş.'}</Text>
                </AppCard>

                {dietitian.socialLinks.length > 0 ? (
                    <AppCard>
                        <Text style={styles.sectionTitle}>Sosyal medya</Text>
                        {dietitian.socialLinks.map((link) => (
                            <Pressable
                                key={link.key}
                                onPress={() => openCheckedExternalLink(link.url, (url) => isAllowedSocialLink(link.key, url))}
                                accessibilityRole="link"
                                accessibilityLabel={`${link.label} hesabını aç`}
                                style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
                            >
                                <Icon name="forward" size={18} color={colors.primaryDark} />
                                <Text style={styles.linkLabel}>{link.label}</Text>
                                <Text style={styles.linkUrl} numberOfLines={1}>{link.url.replace(/^https:\/\//, '')}</Text>
                            </Pressable>
                        ))}
                    </AppCard>
                ) : null}
            </ScrollView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <ScreenHeader onBack={() => navigation.goBack()} />
            {content}
            <BottomSheetView
                visible={vm.isRequestSheetVisible}
                onClose={vm.closeRequestSheet}
                title="Bağlanma isteği gönder"
                footer={<AppButton label="İsteği gönder" onPress={vm.submitRequest} loading={vm.isSendingRequest} disabled={vm.isSendingRequest} />}
            >
                <Text style={styles.sheetText}>
                    Aynı anda yalnızca bir diyetisyene bağlanma isteği gönderebilirsin. Diyetisyen kabul ettiğinde öğün planın, takiplerin ve sohbetin açılır; profil bilgilerin bu diyetisyenle paylaşılır.
                </Text>
                {vm.requestMessage?.variant === 'error' ? <InlineAlert variant="error" message={vm.requestMessage.text} /> : null}
                <AppInput
                    label="Not (isteğe bağlı)"
                    value={vm.note}
                    onChangeText={vm.setNote}
                    placeholder="Kendini kısaca tanıtabilirsin"
                    multiline
                    maxLength={CONNECTION_NOTE_MAX_LENGTH}
                    editable={!vm.isSendingRequest}
                    hint={`${Array.from(vm.note).length}/${CONNECTION_NOTE_MAX_LENGTH}`}
                />
            </BottomSheetView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.x5, paddingBottom: spacing.x8, gap: spacing.x4 },
    gap: { marginTop: spacing.x4 },
    hero: { alignItems: 'center', gap: spacing.x3 },
    name: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.x2 },
    actions: { gap: spacing.x3 },
    sectionTitle: { ...typography.cardTitle, color: colors.textPrimary, marginBottom: spacing.x3 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.x3, paddingVertical: spacing.x2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
    infoLabel: { ...typography.supporting, color: colors.textSecondary },
    infoValue: { ...typography.bodyMedium, color: colors.textPrimary, flexShrink: 1, textAlign: 'right' },
    muted: { ...typography.supporting, color: colors.textSecondary },
    bio: { ...typography.body, color: colors.textPrimary },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3, minHeight: 44, borderRadius: radius.control },
    linkLabel: { ...typography.bodyMedium, color: colors.textPrimary },
    linkUrl: { ...typography.supporting, color: colors.textSecondary, flex: 1 },
    pressed: { opacity: 0.75 },
    sheetText: { ...typography.supporting, color: colors.textSecondary, marginBottom: spacing.x3 },
});
