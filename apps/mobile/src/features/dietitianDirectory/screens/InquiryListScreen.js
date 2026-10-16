import React, { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { AppCard, EmptyState, ErrorState, InlineAlert, ScreenHeader, SkeletonCard, StatusBadge } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useDietitianDirectory } from '../context/DietitianDirectoryContext';
import { OPEN_INQUIRY_LIMIT, getClosedInquiryCopy } from '../utils/directoryContract.cjs';
import { DietitianAvatar } from '../components/DietitianAvatar';

const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    const sameDay = date.toDateString() === today.toDateString();
    return sameDay
        ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
};

const Separator = () => <View style={styles.separator} />;

function InquiryRow({ inquiry, onPress }) {
    const preview = inquiry.lastMessageBody
        ? `${inquiry.lastMessageIsOwn ? 'Sen: ' : ''}${inquiry.lastMessageBody}`
        : 'Henüz mesaj yok';
    return (
        <AppCard
            onPress={onPress}
            accessibilityLabel={`${inquiry.dietitianName} ile ön görüşme${inquiry.unreadCount ? `, ${inquiry.unreadCount} okunmamış mesaj` : ''}`}
            contentStyle={styles.row}
        >
            <DietitianAvatar name={inquiry.dietitianName} size={44} />
            <View style={styles.rowText}>
                <View style={styles.rowTop}>
                    <Text style={styles.name} numberOfLines={1}>{inquiry.dietitianName}</Text>
                    <Text style={styles.time}>{formatTime(inquiry.lastMessageAt)}</Text>
                </View>
                <Text style={[styles.preview, inquiry.unreadCount > 0 && styles.previewUnread]} numberOfLines={2}>{preview}</Text>
                {inquiry.status !== 'open' ? <Text style={styles.closed} numberOfLines={2}>{getClosedInquiryCopy(inquiry)}</Text> : null}
            </View>
            {inquiry.unreadCount > 0 ? (
                <View style={styles.unread}><Text style={styles.unreadText}>{inquiry.unreadCount > 9 ? '9+' : inquiry.unreadCount}</Text></View>
            ) : null}
        </AppCard>
    );
}

export default function InquiryListScreen({ navigation }) {
    const directory = useDietitianDirectory();
    const { refresh } = directory;

    useFocusEffect(useCallback(() => { void refresh({ silent: true }); }, [refresh]));

    const openInquiry = (inquiry) => navigation.navigate('InquiryChat', {
        inquiryId: inquiry.id,
        dietitianId: inquiry.dietitianId,
        dietitianName: inquiry.dietitianName,
    });

    let body;
    if (directory.status === 'loading' || directory.status === 'idle') {
        body = [1, 2].map((key) => <SkeletonCard key={key} animated style={styles.skeleton} />);
    } else if (directory.status === 'error') {
        body = <ErrorState title="Mesajlar yüklenemedi" description={directory.error} onRetry={() => refresh()} />;
    } else {
        body = (
            <FlatList
                data={directory.inquiries}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <InquiryRow inquiry={item} onPress={() => openInquiry(item)} />}
                ItemSeparatorComponent={Separator}
                ListHeaderComponent={(
                    <View style={styles.listHeader}>
                        <StatusBadge status="info" label={`Açık ön görüşme ${directory.openInquiryCount}/${OPEN_INQUIRY_LIMIT}`} />
                        {directory.error ? <InlineAlert variant="error" message={directory.error} /> : null}
                    </View>
                )}
                ListEmptyComponent={(
                    <EmptyState
                        icon="message"
                        title="Henüz ön görüşmen yok"
                        description="Diyetisyenler sekmesinden bir profil seçip mesaj gönderebilirsin."
                        actionLabel="Diyetisyenleri gör"
                        onAction={() => navigation.navigate('Diyetisyenler')}
                    />
                )}
                refreshControl={<RefreshControl refreshing={false} onRefresh={() => refresh()} tintColor={colors.primaryDark} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <ScreenHeader title="Mesajlar" subtitle="Bağlanmadan önce diyetisyenlerle yaptığın ön görüşmeler." />
            <View style={styles.content}>{body}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: spacing.x5 },
    listHeader: { gap: spacing.x3, marginBottom: spacing.x4, alignItems: 'flex-start' },
    listContent: { paddingBottom: spacing.x8, flexGrow: 1 },
    separator: { height: spacing.x3 },
    skeleton: { marginBottom: spacing.x3 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    rowText: { flex: 1, minWidth: 0, gap: 2 },
    rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    name: { ...typography.cardTitle, color: colors.textPrimary, flex: 1 },
    time: { ...typography.caption, color: colors.textTertiary },
    preview: { ...typography.supporting, color: colors.textSecondary },
    previewUnread: { color: colors.textPrimary, fontWeight: '600' },
    closed: { ...typography.caption, color: colors.textTertiary },
    unread: { minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: radius.round, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
    unreadText: { ...typography.caption, color: colors.white, fontWeight: '700' },
});
