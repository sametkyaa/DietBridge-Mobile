import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
    AppButton,
    AppSkeleton,
    EmptyState,
    ErrorState,
    Icon,
    InlineAlert,
} from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { useNotifications } from '../context/NotificationContext';
import { NOTIFICATION_QUERY_MODES } from '../constants/notificationConstants';
import { resolveNotificationDestination } from '../services/notificationNavigationService';
import NotificationCard from '../components/NotificationCard';

const VIEWABILITY_CONFIG = Object.freeze({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 200,
});

const NotificationSeparator = () => <View style={styles.separator} />;

function ScreenHeader({ navigation, canMarkAllRead, isMarkingAll, onMarkAllRead }) {
    return (
        <View style={styles.header}>
            <View style={styles.headerTopRow}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    accessibilityRole="button"
                    accessibilityLabel="Geri"
                    hitSlop={4}
                    style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
                >
                    <Icon name="back" size={22} color={colors.textPrimary} />
                </Pressable>
                <Text accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>Bildirimler</Text>
                <View style={styles.headerTopSpacer} accessible={false} />
            </View>
            <View style={styles.markAllRow}>
                <Pressable
                    onPress={canMarkAllRead && !isMarkingAll ? onMarkAllRead : undefined}
                    disabled={!canMarkAllRead || isMarkingAll}
                    accessibilityRole="button"
                    accessibilityLabel="Tümünü okundu işaretle"
                    accessibilityState={{
                        disabled: !canMarkAllRead || isMarkingAll,
                        busy: isMarkingAll,
                    }}
                    style={({ pressed }) => [
                        styles.markAllButton,
                        !canMarkAllRead && styles.markAllDisabled,
                        pressed && canMarkAllRead && !isMarkingAll && styles.pressed,
                    ]}
                >
                    {isMarkingAll ? <ActivityIndicator size="small" color={colors.primaryDark} /> : null}
                    <Text style={styles.markAllLabel} numberOfLines={1}>Tümünü okundu işaretle</Text>
                </Pressable>
            </View>
        </View>
    );
}

function QueryTabs({ queryMode, onChange }) {
    const tabs = [
        { key: NOTIFICATION_QUERY_MODES.ALL, label: 'Tümü' },
        { key: NOTIFICATION_QUERY_MODES.UNREAD, label: 'Okunmamış' },
    ];

    return (
        <View style={styles.tabs} accessibilityRole="tablist">
            {tabs.map((tab) => {
                const selected = queryMode === tab.key;
                return (
                    <Pressable
                        key={tab.key}
                        onPress={() => onChange(tab.key)}
                        accessibilityRole="tab"
                        accessibilityLabel={tab.label}
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [
                            styles.tab,
                            selected && styles.selectedTab,
                            pressed && styles.pressed,
                        ]}
                    >
                        <Text style={[styles.tabLabel, selected && styles.selectedTabLabel]}>{tab.label}</Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

function NotificationLoadingState() {
    return (
        <View style={styles.loadingList} accessibilityRole="progressbar" accessibilityLabel="Bildirimler yükleniyor" accessibilityState={{ busy: true }}>
            {[1, 2, 3].map((key) => (
                <View key={key} style={styles.skeletonCard}>
                    <AppSkeleton width={40} height={40} borderRadius={20} />
                    <View style={styles.skeletonBody}>
                        <AppSkeleton height={15} />
                        <AppSkeleton width="72%" height={12} />
                        <AppSkeleton width="30%" height={10} />
                    </View>
                </View>
            ))}
        </View>
    );
}

export default function NotificationCenterScreen({ navigation }) {
    const {
        notifications,
        queryMode,
        isLoading,
        isRefreshing,
        hasMore,
        error,
        refresh,
        setQueryMode,
        loadMore,
        markRead,
        markVisibleSeen,
        markAllRead,
    } = useNotifications();
    const { activeConnection, pendingRequest } = useDietitianConnection();
    const [hasRequestedInitialLoad, setHasRequestedInitialLoad] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [processingIds, setProcessingIds] = useState(() => new Set());

    const notificationsRef = useRef(notifications);
    const markVisibleSeenRef = useRef(markVisibleSeen);
    const pendingSeenIdsRef = useRef(new Set());
    const submittedSeenIdsRef = useRef(new Set());
    const previousUnseenStateRef = useRef(new Map());
    const visibleSeenTimerRef = useRef(null);
    const submitVisibleSeenRef = useRef(null);
    const processingIdsRef = useRef(new Set());
    const viewabilityConfigRef = useRef(VIEWABILITY_CONFIG);

    notificationsRef.current = notifications;
    markVisibleSeenRef.current = markVisibleSeen;

    useFocusEffect(
        useCallback(() => {
            setHasRequestedInitialLoad(true);
            void refresh();
            return undefined;
        }, [refresh]),
    );

    useEffect(() => {
        const nextUnseenState = new Map();
        const currentIds = new Set(notifications.map((notification) => notification.id));

        notifications.forEach((notification) => {
            const isUnseen = notification.seenAt === null;
            const wasUnseen = previousUnseenStateRef.current.get(notification.id);
            if (!isUnseen || wasUnseen === false) submittedSeenIdsRef.current.delete(notification.id);
            nextUnseenState.set(notification.id, isUnseen);
        });

        submittedSeenIdsRef.current.forEach((id) => {
            if (!currentIds.has(id)) submittedSeenIdsRef.current.delete(id);
        });
        previousUnseenStateRef.current = nextUnseenState;
    }, [notifications]);

    const scheduleVisibleSeen = useCallback((ids) => {
        ids.forEach((id) => pendingSeenIdsRef.current.add(id));
        if (visibleSeenTimerRef.current || pendingSeenIdsRef.current.size === 0) return;

        visibleSeenTimerRef.current = setTimeout(async () => {
            visibleSeenTimerRef.current = null;
            const currentRows = new Map(notificationsRef.current.map((notification) => [notification.id, notification]));
            const batch = [...pendingSeenIdsRef.current]
                .filter((id) => currentRows.get(id)?.seenAt === null && !submittedSeenIdsRef.current.has(id))
                .slice(0, 100);
            pendingSeenIdsRef.current.clear();
            if (batch.length === 0) return;

            batch.forEach((id) => submittedSeenIdsRef.current.add(id));
            const changedCount = await markVisibleSeenRef.current(batch);
            if (!changedCount) batch.forEach((id) => submittedSeenIdsRef.current.delete(id));
        }, 100);
    }, []);

    submitVisibleSeenRef.current = scheduleVisibleSeen;

    const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
        const visibleIds = new Set(
            viewableItems
                .map((entry) => entry?.item?.id)
                .filter(Boolean),
        );
        const visibleUnseenIds = notificationsRef.current
            .filter((notification) => visibleIds.has(notification.id) && notification.seenAt === null)
            .map((notification) => notification.id)
            .filter((id) => !submittedSeenIdsRef.current.has(id));
        if (visibleUnseenIds.length > 0) submitVisibleSeenRef.current?.(visibleUnseenIds);
    });

    useEffect(() => () => {
        if (visibleSeenTimerRef.current) clearTimeout(visibleSeenTimerRef.current);
        visibleSeenTimerRef.current = null;
        pendingSeenIdsRef.current.clear();
        submittedSeenIdsRef.current.clear();
    }, []);

    const setProcessing = useCallback((id, processing) => {
        if (processing) processingIdsRef.current.add(id);
        else processingIdsRef.current.delete(id);
        setProcessingIds(new Set(processingIdsRef.current));
    }, []);

    const handleNotificationPress = useCallback(async (notification) => {
        if (!notification?.id || processingIdsRef.current.has(notification.id)) return;

        setProcessing(notification.id, true);
        setActionError(null);
        try {
            const destination = await resolveNotificationDestination({
                notification,
                activeConnection,
                pendingRequest,
            });
            const marked = await markRead(notification.id);
            if (!marked) {
                setActionError('Bildirim okunamadı. Lütfen tekrar deneyin.');
                return;
            }

            if (destination.kind === 'invalid') {
                Alert.alert('Bildirim açılamadı', destination.message);
                return;
            }
            if (destination.kind === 'removedAppointment') {
                Alert.alert('Randevu görüntülenemiyor', 'Bu randevu artık görüntülenemiyor.');
                return;
            }
            if (destination.kind === 'chat') {
                navigation.navigate('MainTabs', { screen: 'Sohbet' });
                return;
            }
            if (destination.kind === 'appointment') {
                navigation.navigate('AppointmentDetail', { appointment: destination.appointment });
                return;
            }
            if (destination.kind === 'relationship') {
                navigation.navigate('MainTabs', { screen: 'Ana Sayfa' });
            }
        } catch (error) {
            setActionError('Bildirim açılamadı. Lütfen tekrar deneyin.');
        } finally {
            setProcessing(notification.id, false);
        }
    }, [activeConnection, markRead, navigation, pendingRequest, setProcessing]);

    const handleModeChange = useCallback((nextMode) => {
        if (nextMode === queryMode) return;
        setHasRequestedInitialLoad(true);
        setActionError(null);
        void setQueryMode(nextMode);
    }, [queryMode, setQueryMode]);

    const handleRetry = useCallback(() => {
        setHasRequestedInitialLoad(true);
        setActionError(null);
        void refresh();
    }, [refresh]);

    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        try {
            await loadMore();
        } finally {
            setIsLoadingMore(false);
        }
    }, [hasMore, isLoadingMore, loadMore]);

    const handleMarkAllRead = useCallback(async () => {
        if (isMarkingAll || !notifications.some((notification) => notification.readAt === null)) return;
        setIsMarkingAll(true);
        setActionError(null);
        try {
            const result = await markAllRead();
            if (result === 0 && error) setActionError('Bildirimler okunamadı. Lütfen tekrar deneyin.');
        } finally {
            setIsMarkingAll(false);
        }
    }, [error, isMarkingAll, markAllRead, notifications]);

    const canMarkAllRead = useMemo(
        () => notifications.some((notification) => notification.readAt === null),
        [notifications],
    );
    const isInitialLoading = !hasRequestedInitialLoad || (isLoading && notifications.length === 0);
    const isEmpty = !isInitialLoading && !error && notifications.length === 0;
    const isFullError = !isInitialLoading && !!error && notifications.length === 0;
    const listHeader = error && notifications.length > 0 ? (
        <InlineAlert
            variant="error"
            title="Bildirimler yüklenemedi."
            message={error.message}
        />
    ) : null;

    const renderItem = useCallback(({ item }) => (
        <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
            disabled={processingIds.has(item.id)}
        />
    ), [handleNotificationPress, processingIds]);

    const renderFooter = useCallback(() => {
        if (!hasMore) return <View style={styles.footerSpacer} />;
        return (
            <View style={styles.footer}>
                <AppButton
                    variant="text"
                    label="Daha fazla yükle"
                    onPress={handleLoadMore}
                    loading={isLoadingMore}
                    disabled={isRefreshing}
                />
            </View>
        );
    }, [handleLoadMore, hasMore, isLoadingMore, isRefreshing]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <ScreenHeader
                navigation={navigation}
                canMarkAllRead={canMarkAllRead}
                isMarkingAll={isMarkingAll}
                onMarkAllRead={handleMarkAllRead}
            />
            <View style={styles.content}>
                <QueryTabs queryMode={queryMode} onChange={handleModeChange} />
                {actionError ? (
                    <InlineAlert
                        variant="error"
                        title="Bildirim işlemi tamamlanamadı."
                        message={actionError}
                        onDismiss={() => setActionError(null)}
                        style={styles.actionAlert}
                    />
                ) : null}
                <View style={styles.listArea}>
                    {isInitialLoading ? <NotificationLoadingState /> : null}
                    {isFullError ? (
                        <ErrorState
                            title="Bildirimler yüklenemedi."
                            description="Bildirim bilgileri şu anda alınamıyor."
                            onRetry={handleRetry}
                            retryLabel="Tekrar dene"
                        />
                    ) : null}
                    {isEmpty ? (
                        <EmptyState
                            icon="bell"
                            title={queryMode === NOTIFICATION_QUERY_MODES.UNREAD
                                ? 'Okunmamış bildiriminiz yok.'
                                : 'Henüz bildiriminiz yok.'}
                            description={queryMode === NOTIFICATION_QUERY_MODES.ALL
                                ? 'Yeni bildirimler burada görünecek.'
                                : undefined}
                        />
                    ) : null}
                    {!isInitialLoading && !isFullError && !isEmpty ? (
                        <FlatList
                            data={notifications}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            ItemSeparatorComponent={NotificationSeparator}
                            ListHeaderComponent={listHeader}
                            ListHeaderComponentStyle={styles.listHeader}
                            ListFooterComponent={renderFooter}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            refreshing={isRefreshing}
                            onRefresh={() => refresh({ showLoading: false })}
                            onViewableItemsChanged={onViewableItemsChangedRef.current}
                            viewabilityConfig={viewabilityConfigRef.current}
                            accessibilityLabel="Bildirim listesi"
                        />
                    ) : null}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingTop: spacing.x1,
        paddingBottom: spacing.x1,
        paddingHorizontal: spacing.x2,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
        backgroundColor: colors.surface,
    },
    headerTopRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
    headerTopSpacer: { width: 44, height: 44 },
    markAllRow: { minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
    markAllButton: {
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: spacing.x1,
        paddingHorizontal: spacing.x1,
    },
    markAllLabel: {
        ...typography.caption,
        color: colors.primaryDark,
        textAlign: 'right',
    },
    markAllDisabled: { opacity: 0.45 },
    content: { flex: 1, paddingHorizontal: spacing.x4, paddingTop: spacing.x3 },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.control,
        padding: spacing.x1,
    },
    tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small },
    selectedTab: { backgroundColor: colors.surface, elevation: 1 },
    tabLabel: { ...typography.bodyMedium, color: colors.textSecondary },
    selectedTabLabel: { color: colors.primaryDark },
    listArea: { flex: 1, marginTop: spacing.x4 },
    listContent: { paddingBottom: spacing.x8 },
    listHeader: { marginBottom: spacing.x3 },
    separator: { height: spacing.x3 },
    footer: { alignItems: 'center', paddingVertical: spacing.x4 },
    footerSpacer: { height: spacing.x4 },
    actionAlert: { marginTop: spacing.x3 },
    loadingList: { gap: spacing.x3 },
    skeletonCard: {
        minHeight: 88,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x3,
        padding: spacing.x4,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.borderSoft,
    },
    skeletonBody: { flex: 1, gap: spacing.x2 },
    pressed: { opacity: 0.7 },
});
