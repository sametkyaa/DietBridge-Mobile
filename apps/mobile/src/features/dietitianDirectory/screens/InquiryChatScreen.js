import { Alert } from '../../../shared/utils/errorAlert';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, ErrorState, Icon, InlineAlert, ScreenHeader } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { formatUserError } from '../../../shared/utils/userError.cjs';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { useInquiryChatViewModel } from '../viewmodels/useInquiryChatViewModel';

const HEALTH_NOTICE = 'Bu diyetisyene henüz bağlı değilsin. Sağlık bilgilerini paylaşırken dikkatli ol.';

const formatTime = (value) => {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

function InquiryBubble({ message }) {
    return (
        <View style={[styles.bubbleRow, message.isOwn ? styles.ownRow : styles.otherRow]}>
            <View style={[styles.bubble, message.isOwn ? styles.ownBubble : styles.otherBubble]}>
                <Text style={[styles.body, message.isOwn ? styles.ownBody : styles.otherBody]}>{message.body}</Text>
                <Text style={[styles.time, message.isOwn ? styles.ownTime : styles.otherTime]}>{formatTime(message.createdAt)}</Text>
            </View>
        </View>
    );
}

export default function InquiryChatScreen({ navigation, route }) {
    const { userId } = useDietitianConnection();
    const params = route?.params || {};
    const vm = useInquiryChatViewModel({ userId, dietitianId: params.dietitianId, initialInquiryId: params.inquiryId || null });
    const listRef = useRef(null);
    const dietitianName = vm.inquiry?.dietitianName || params.dietitianName || 'Diyetisyen';

    useEffect(() => {
        if (vm.messages.length > 0) requestAnimationFrame(() => listRef.current?.scrollToEnd?.({ animated: true }));
    }, [vm.messages.length]);

    const confirmClose = () => Alert.alert(
        'Ön görüşmeyi kapat',
        'Kapatınca bu diyetisyene yeni mesaj gönderemezsin ve yeni bir diyetisyene yazmak için yer açılır.',
        [
            { text: 'Vazgeç', style: 'cancel' },
            { text: 'Görüşmeyi kapat', style: 'destructive', onPress: () => void vm.close() },
        ],
    );

    const headerRight = (
        <View style={styles.headerActions}>
            {params.dietitianId ? (
                <AppButton
                    variant="text"
                    label="Profil"
                    onPress={() => navigation.navigate('DietitianPublicProfile', { dietitianId: params.dietitianId })}
                />
            ) : null}
            {vm.canClose ? <AppButton variant="text" label="Kapat" onPress={confirmClose} loading={vm.isClosing} disabled={vm.isClosing} /> : null}
        </View>
    );

    let body;
    if (vm.status === 'loading') {
        body = <ActivityIndicator style={styles.loading} color={colors.primaryDark} accessibilityLabel="Mesajlar yükleniyor" />;
    } else if (vm.status === 'error') {
        body = <ErrorState title="Mesajlar yüklenemedi" description={vm.error} onRetry={vm.retry} />;
    } else {
        body = (
            <FlatList
                ref={listRef}
                data={vm.messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <InquiryBubble message={item} />}
                ListHeaderComponent={<InlineAlert variant="info" message={HEALTH_NOTICE} style={styles.notice} />}
                ListEmptyComponent={(
                    <Text style={styles.empty}>
                        {`${dietitianName} ile ilk mesajını yaz. Kendini kısaca tanıtıp hedefini anlatabilirsin.`}
                    </Text>
                )}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <ScreenHeader title={dietitianName} subtitle="Ön görüşme" onBack={() => navigation.goBack()} right={headerRight} />
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.flex}>{body}</View>
                {vm.blockedMessage ? (
                    <View style={styles.composer}>
                        <InlineAlert variant="info" message={vm.blockedMessage} />
                    </View>
                ) : (
                    <View style={styles.composer}>
                        {vm.sendError ? <Text style={styles.sendError} accessibilityLiveRegion="polite">{formatUserError(vm.sendError)}</Text> : null}
                        <View style={styles.inputRow}>
                            <TextInput
                                value={vm.draft}
                                onChangeText={vm.setDraft}
                                placeholder="Mesajınızı yazın"
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                maxLength={vm.maxLength}
                                editable={!vm.isSending}
                                accessibilityLabel="Mesaj"
                                style={styles.input}
                            />
                            <Pressable
                                onPress={vm.canSend ? vm.send : undefined}
                                disabled={!vm.canSend}
                                accessibilityRole="button"
                                accessibilityLabel="Mesajı gönder"
                                accessibilityState={{ disabled: !vm.canSend, busy: vm.isSending }}
                                style={({ pressed }) => [styles.send, !vm.canSend && styles.sendDisabled, pressed && vm.canSend && styles.pressed]}
                            >
                                {vm.isSending ? <ActivityIndicator size="small" color={colors.white} /> : <Icon name="send" size={20} color={colors.white} />}
                            </Pressable>
                        </View>
                        <Text style={styles.counter}>{`${Array.from(vm.draft).length}/${vm.maxLength}`}</Text>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.x1 },
    loading: { marginTop: spacing.x8 },
    listContent: { paddingHorizontal: spacing.x5, paddingBottom: spacing.x4, gap: spacing.x2, flexGrow: 1 },
    notice: { marginBottom: spacing.x3 },
    empty: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.x6 },
    bubbleRow: { flexDirection: 'row' },
    ownRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '82%', borderRadius: radius.card, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3, gap: spacing.x1 },
    ownBubble: { backgroundColor: colors.primaryDark, borderBottomRightRadius: radius.small },
    otherBubble: { backgroundColor: colors.surface, borderBottomLeftRadius: radius.small },
    body: { ...typography.body, flexShrink: 1 },
    ownBody: { color: colors.white },
    otherBody: { color: colors.textPrimary },
    time: { ...typography.caption, alignSelf: 'flex-end' },
    ownTime: { color: colors.primarySoft },
    otherTime: { color: colors.textTertiary },
    composer: { paddingHorizontal: spacing.x5, paddingTop: spacing.x3, paddingBottom: spacing.x3, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, backgroundColor: colors.surface },
    sendError: { ...typography.caption, color: colors.errorDark, marginBottom: spacing.x2 },
    inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x2 },
    input: { ...typography.body, flex: 1, minHeight: 44, maxHeight: 140, borderRadius: radius.control, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.x4, paddingTop: spacing.x3, paddingBottom: spacing.x3, color: colors.textPrimary },
    send: { width: 44, height: 44, borderRadius: radius.round, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
    sendDisabled: { opacity: 0.45 },
    pressed: { opacity: 0.8 },
    counter: { ...typography.caption, color: colors.textTertiary, alignSelf: 'flex-end', marginTop: spacing.x1 },
});
