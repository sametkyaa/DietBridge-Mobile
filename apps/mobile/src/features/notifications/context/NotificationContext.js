import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
    fetchNotificationsPage,
    fetchUnseenNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
    markNotificationSeen,
    markNotificationsSeen,
} from '../services/notificationService';
import { subscribeToNotificationChanges } from '../services/notificationRealtimeService';
import {
    NOTIFICATION_QUERY_MODES,
} from '../constants/notificationConstants';
import {
    isNotificationQueryMode,
    isValidUuid,
    mergeNotifications,
} from '../utils/notificationUtils';
import {
    createNotificationRefreshScheduler,
} from '../utils/notificationRealtimePolicy.cjs';

const EMPTY_NOTIFICATIONS = [];

const DEFAULT_NOTIFICATION_CONTEXT = {
    notifications: EMPTY_NOTIFICATIONS,
    unseenCount: 0,
    queryMode: NOTIFICATION_QUERY_MODES.ALL,
    isLoading: false,
    isRefreshing: false,
    hasMore: false,
    error: null,
    realtimeStatus: 'idle',
    loadMore: async () => null,
    refresh: async () => null,
    setQueryMode: async () => null,
    markSeen: async () => null,
    markRead: async () => null,
    markVisibleSeen: async () => 0,
    markAllRead: async () => 0,
};

const NotificationContext = createContext(DEFAULT_NOTIFICATION_CONTEXT);

const normalizeContextError = (error) => ({
    code: error?.code || 'UNKNOWN',
    message: error?.userMessage || 'Bildirimler şu anda yüklenemedi. Lütfen tekrar deneyin.',
});

export const NotificationProvider = ({ children, userId = null }) => {
    const [notifications, setNotifications] = useState(EMPTY_NOTIFICATIONS);
    const [unseenCount, setUnseenCount] = useState(0);
    const [queryMode, setQueryModeState] = useState(NOTIFICATION_QUERY_MODES.ALL);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState(null);
    const [realtimeStatus, setRealtimeStatus] = useState('idle');

    const isMountedRef = useRef(true);
    const notificationsRef = useRef(EMPTY_NOTIFICATIONS);
    const currentUserIdRef = useRef(userId || null);
    const queryModeRef = useRef(NOTIFICATION_QUERY_MODES.ALL);
    const cursorRef = useRef(null);
    const hasMoreRef = useRef(false);
    const sessionGenerationRef = useRef(0);
    const refreshRequestRef = useRef(null);
    const loadMoreRequestRef = useRef(null);
    const schedulerRef = useRef(null);
    const appStateRef = useRef(AppState.currentState || 'active');

    const isCurrentSession = useCallback((generation, expectedUserId) => (
        isMountedRef.current
        && sessionGenerationRef.current === generation
        && currentUserIdRef.current === expectedUserId
    ), []);

    const setNotificationsState = useCallback((nextNotifications) => {
        notificationsRef.current = nextNotifications;
        if (isMountedRef.current) setNotifications(nextNotifications);
    }, []);

    const resetNotificationState = useCallback((nextMode = NOTIFICATION_QUERY_MODES.ALL) => {
        queryModeRef.current = nextMode;
        cursorRef.current = null;
        hasMoreRef.current = false;
        setQueryModeState(nextMode);
        setNotificationsState(EMPTY_NOTIFICATIONS);
        if (isMountedRef.current) {
            setUnseenCount(0);
            setIsLoading(false);
            setIsRefreshing(false);
            setHasMore(false);
            setError(null);
            setRealtimeStatus('idle');
        }
    }, [setNotificationsState]);

    const refresh = useCallback(async ({ mode, showLoading = true } = {}) => {
        const activeUserId = currentUserIdRef.current;
        if (!activeUserId || !isValidUuid(activeUserId)) {
            resetNotificationState();
            return null;
        }

        const nextMode = mode || queryModeRef.current;
        if (!isNotificationQueryMode(nextMode)) {
            if (isMountedRef.current) setError({ code: 'INVALID_INPUT', message: 'Bildirim görünümü geçersiz.' });
            return null;
        }

        if (refreshRequestRef.current) return refreshRequestRef.current;

        const generation = sessionGenerationRef.current;
        const requestUserId = activeUserId;
        if (nextMode !== queryModeRef.current) {
            queryModeRef.current = nextMode;
            cursorRef.current = null;
            hasMoreRef.current = false;
            setQueryModeState(nextMode);
            setNotificationsState(EMPTY_NOTIFICATIONS);
            if (isMountedRef.current) setHasMore(false);
        }
        if (isMountedRef.current) {
            setError(null);
            setIsRefreshing(true);
            if (showLoading && notificationsRef.current.length === 0) setIsLoading(true);
        }

        const request = (async () => {
            try {
                const [page, nextUnseenCount] = await Promise.all([
                    fetchNotificationsPage({ mode: nextMode }),
                    fetchUnseenNotificationCount(),
                ]);
                if (!isCurrentSession(generation, requestUserId)) return null;

                cursorRef.current = page.nextCursor;
                hasMoreRef.current = page.hasMore;
                setNotificationsState(page.notifications);
                setUnseenCount(nextUnseenCount);
                setHasMore(page.hasMore);
                setError(null);
                return page;
            } catch (requestError) {
                if (isCurrentSession(generation, requestUserId)) {
                    setError(normalizeContextError(requestError));
                }
                return null;
            } finally {
                if (isCurrentSession(generation, requestUserId)) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
                if (refreshRequestRef.current === request) refreshRequestRef.current = null;
            }
        })();
        refreshRequestRef.current = request;
        return request;
    }, [isCurrentSession, resetNotificationState, setNotificationsState]);

    const loadMore = useCallback(async () => {
        const activeUserId = currentUserIdRef.current;
        const cursor = cursorRef.current;
        if (!activeUserId || !isValidUuid(activeUserId) || !hasMoreRef.current || !cursor) return null;
        if (refreshRequestRef.current) return refreshRequestRef.current;
        if (loadMoreRequestRef.current) return loadMoreRequestRef.current;

        const generation = sessionGenerationRef.current;
        const requestUserId = activeUserId;
        const request = (async () => {
            try {
                const page = await fetchNotificationsPage({
                    cursor,
                    mode: queryModeRef.current,
                });
                if (!isCurrentSession(generation, requestUserId)) return null;

                const merged = mergeNotifications(
                    notificationsRef.current,
                    page.notifications,
                    queryModeRef.current,
                );
                cursorRef.current = page.nextCursor;
                hasMoreRef.current = page.hasMore;
                setNotificationsState(merged);
                setHasMore(page.hasMore);
                setError(null);
                return page;
            } catch (requestError) {
                if (isCurrentSession(generation, requestUserId)) setError(normalizeContextError(requestError));
                return null;
            } finally {
                if (loadMoreRequestRef.current === request) loadMoreRequestRef.current = null;
            }
        })();
        loadMoreRequestRef.current = request;
        return request;
    }, [isCurrentSession, setNotificationsState]);

    const setQueryMode = useCallback((nextMode) => {
        if (!isNotificationQueryMode(nextMode)) {
            if (isMountedRef.current) setError({ code: 'INVALID_INPUT', message: 'Bildirim görünümü geçersiz.' });
            return Promise.resolve(null);
        }
        return refresh({ mode: nextMode });
    }, [refresh]);

    const reconcileAfterMutation = useCallback(async (notification) => {
        if (notification?.id && notification.recipientId === currentUserIdRef.current) {
            const merged = mergeNotifications(
                notificationsRef.current,
                [notification],
                queryModeRef.current,
            );
            setNotificationsState(merged);
        }
        return refresh({ showLoading: false });
    }, [refresh, setNotificationsState]);

    const markSeen = useCallback(async (notificationId) => {
        try {
            const notification = await markNotificationSeen(notificationId);
            await reconcileAfterMutation(notification);
            return notification;
        } catch (mutationError) {
            if (isMountedRef.current) setError(normalizeContextError(mutationError));
            return null;
        }
    }, [reconcileAfterMutation]);

    const markRead = useCallback(async (notificationId) => {
        try {
            const notification = await markNotificationRead(notificationId);
            await reconcileAfterMutation(notification);
            return notification;
        } catch (mutationError) {
            if (isMountedRef.current) setError(normalizeContextError(mutationError));
            return null;
        }
    }, [reconcileAfterMutation]);

    const markVisibleSeen = useCallback(async (notificationIds) => {
        try {
            const count = await markNotificationsSeen(notificationIds);
            await refresh({ showLoading: false });
            return count;
        } catch (mutationError) {
            if (isMountedRef.current) setError(normalizeContextError(mutationError));
            return 0;
        }
    }, [refresh]);

    const markAllRead = useCallback(async () => {
        try {
            const count = await markAllNotificationsRead();
            await refresh({ showLoading: false });
            return count;
        } catch (mutationError) {
            if (isMountedRef.current) setError(normalizeContextError(mutationError));
            return 0;
        }
    }, [refresh]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const nextUserId = userId || null;
        if (currentUserIdRef.current === nextUserId) return;
        currentUserIdRef.current = nextUserId;
        sessionGenerationRef.current += 1;
        refreshRequestRef.current = null;
        loadMoreRequestRef.current = null;
        resetNotificationState();
    }, [resetNotificationState, userId]);

    useEffect(() => {
        if (!userId || !isValidUuid(userId)) return undefined;
        const subscription = subscribeToNotificationChanges({
            expectedUserId: userId,
            onNotification: (notification) => {
                if (currentUserIdRef.current !== userId) return;
                setNotificationsState(mergeNotifications(
                    notificationsRef.current,
                    [notification],
                    queryModeRef.current,
                ));
            },
            onStatus: (status) => {
                if (currentUserIdRef.current === userId) setRealtimeStatus(status.status);
            },
            onReconcileRequired: () => schedulerRef.current?.notify(),
            onError: (subscriptionError) => {
                if (currentUserIdRef.current === userId) setError(normalizeContextError(subscriptionError));
            },
        });
        subscription.ready.catch(() => undefined);
        return () => {
            subscription.unsubscribe();
        };
    }, [setNotificationsState, userId]);

    useEffect(() => {
        if (!userId || !isValidUuid(userId)) return undefined;
        const scheduler = createNotificationRefreshScheduler({
            onRefresh: () => refresh({ showLoading: false }),
        });
        schedulerRef.current = scheduler;
        return () => {
            scheduler.dispose();
            if (schedulerRef.current === scheduler) schedulerRef.current = null;
        };
    }, [refresh, userId]);

    useEffect(() => {
        if (!userId || !isValidUuid(userId)) {
            resetNotificationState();
            return undefined;
        }
        refresh();
        return undefined;
    }, [refresh, resetNotificationState, userId]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            const previousAppState = appStateRef.current;
            appStateRef.current = nextAppState;
            if (
                nextAppState === 'active'
                && previousAppState !== 'active'
                && currentUserIdRef.current
            ) {
                if (schedulerRef.current) schedulerRef.current.notify();
                else refresh({ showLoading: false });
            }
        });
        return () => subscription.remove();
    }, [refresh]);

    const value = useMemo(() => ({
        notifications,
        unseenCount,
        queryMode,
        isLoading,
        isRefreshing,
        hasMore,
        error,
        realtimeStatus,
        loadMore,
        refresh,
        setQueryMode,
        markSeen,
        markRead,
        markVisibleSeen,
        markAllRead,
    }), [
        error,
        hasMore,
        isLoading,
        isRefreshing,
        loadMore,
        markAllRead,
        markRead,
        markSeen,
        markVisibleSeen,
        notifications,
        queryMode,
        realtimeStatus,
        refresh,
        setQueryMode,
        unseenCount,
    ]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => useContext(NotificationContext);

export default NotificationProvider;
