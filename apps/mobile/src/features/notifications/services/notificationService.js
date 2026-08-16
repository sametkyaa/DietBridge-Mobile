import { supabase } from '../../../lib/supabaseClient';
import {
    NOTIFICATION_BATCH_MAX_SIZE,
    NOTIFICATION_DEFAULT_PAGE_SIZE,
    NOTIFICATION_MAX_PAGE_SIZE,
    NOTIFICATION_QUERY_MODES,
    NOTIFICATION_SELECT_COLUMNS,
} from '../constants/notificationConstants';
import {
    isValidUuid,
    isNotificationQueryMode,
    normalizeNotificationCursor,
    normalizeNotificationRow,
} from '../utils/notificationUtils';

export const NOTIFICATION_ERROR_CODES = Object.freeze({
    INVALID_INPUT: 'INVALID_INPUT',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    FORBIDDEN: 'FORBIDDEN',
    QUERY: 'QUERY',
    RPC: 'RPC',
    MALFORMED_ROW: 'MALFORMED_ROW',
    REALTIME: 'REALTIME',
    UNKNOWN: 'UNKNOWN',
});

const GENERIC_ERROR_MESSAGE = 'Bildirimler şu anda yüklenemedi. Lütfen tekrar deneyin.';
const AUTH_ERROR_MESSAGE = 'Oturumunuz doğrulanamadı. Lütfen yeniden giriş yapın.';
const INVALID_INPUT_MESSAGE = 'Bildirim bilgisi geçersiz. Lütfen tekrar deneyin.';

export class NotificationServiceError extends Error {
    constructor(code, userMessage = GENERIC_ERROR_MESSAGE, cause) {
        super(userMessage);
        this.name = 'NotificationServiceError';
        this.code = code;
        this.userMessage = userMessage;
        if (cause !== undefined) this.cause = cause;
    }
}

const createInvalidInputError = (field) => new NotificationServiceError(
    NOTIFICATION_ERROR_CODES.INVALID_INPUT,
    INVALID_INPUT_MESSAGE,
    new Error(`Invalid notification field: ${field}`),
);

const toNotificationServiceError = (error, fallbackCode = NOTIFICATION_ERROR_CODES.QUERY) => {
    if (error instanceof NotificationServiceError) return error;

    const databaseCode = error && typeof error === 'object' ? error.code : undefined;
    const status = error && typeof error === 'object' ? error.status : undefined;
    const rawMessage = error && typeof error.message === 'string' ? error.message.toLowerCase() : '';

    if (status === 401 || databaseCode === '42501') {
        return new NotificationServiceError(
            databaseCode === '42501' ? NOTIFICATION_ERROR_CODES.FORBIDDEN : NOTIFICATION_ERROR_CODES.UNAUTHENTICATED,
            databaseCode === '42501' ? 'Bu bildirime erişim izniniz yok.' : AUTH_ERROR_MESSAGE,
            error,
        );
    }
    if (databaseCode === '22023' || databaseCode === '22P02') {
        return new NotificationServiceError(NOTIFICATION_ERROR_CODES.INVALID_INPUT, INVALID_INPUT_MESSAGE, error);
    }
    if (rawMessage.includes('network') || rawMessage.includes('failed to fetch')) {
        return new NotificationServiceError(
            NOTIFICATION_ERROR_CODES.QUERY,
            'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
            error,
        );
    }

    return new NotificationServiceError(fallbackCode, GENERIC_ERROR_MESSAGE, error);
};

// Authorization is always derived from the shared authenticated Supabase
// session. Callers never supply a recipient id to any Notification query.
export const getAuthenticatedNotificationUser = async () => {
    let response;
    try {
        response = await supabase.auth.getUser();
    } catch (error) {
        throw new NotificationServiceError(NOTIFICATION_ERROR_CODES.UNAUTHENTICATED, AUTH_ERROR_MESSAGE, error);
    }

    const user = response?.data?.user;
    if (response?.error || !user?.id || !isValidUuid(user.id)) {
        throw new NotificationServiceError(
            NOTIFICATION_ERROR_CODES.UNAUTHENTICATED,
            AUTH_ERROR_MESSAGE,
            response?.error || null,
        );
    }

    return user;
};

const normalizePageSize = (pageSize) => {
    const size = pageSize === undefined || pageSize === null ? NOTIFICATION_DEFAULT_PAGE_SIZE : pageSize;
    if (!Number.isInteger(size) || size < 1 || size > NOTIFICATION_MAX_PAGE_SIZE) {
        throw createInvalidInputError('pageSize');
    }
    return size;
};

const assertQueryMode = (mode) => {
    if (!isNotificationQueryMode(mode)) throw createInvalidInputError('mode');
    return mode;
};

const normalizeRowsOrThrow = (rows) => {
    if (!Array.isArray(rows)) {
        throw new NotificationServiceError(
            NOTIFICATION_ERROR_CODES.MALFORMED_ROW,
            'Bildirim verisi beklenmeyen bir yapı döndürdü.',
            new Error('Notification list payload is not an array'),
        );
    }

    return rows.map((row) => {
        const notification = normalizeNotificationRow(row);
        if (!notification) {
            throw new NotificationServiceError(
                NOTIFICATION_ERROR_CODES.MALFORMED_ROW,
                'Bildirim verisi geçersiz olduğu için güvenli şekilde gösterilemiyor.',
                new Error('Malformed notification row'),
            );
        }
        return notification;
    });
};

const assertOwnNotification = (notification, userId) => {
    if (!notification || notification.recipientId !== userId) {
        throw new NotificationServiceError(
            NOTIFICATION_ERROR_CODES.FORBIDDEN,
            'Bu bildirime erişim izniniz yok.',
            new Error('Notification recipient mismatch'),
        );
    }
    return notification;
};

export const fetchNotificationsPage = async ({ cursor = null, pageSize, mode = NOTIFICATION_QUERY_MODES.ALL } = {}) => {
    const user = await getAuthenticatedNotificationUser();
    const size = normalizePageSize(pageSize);
    const normalizedMode = assertQueryMode(mode);
    const normalizedCursor = cursor === null || cursor === undefined
        ? null
        : normalizeNotificationCursor(cursor);

    if (cursor !== null && cursor !== undefined && !normalizedCursor) {
        throw createInvalidInputError('cursor');
    }

    try {
        let query = supabase
            .from('notifications')
            .select(NOTIFICATION_SELECT_COLUMNS)
            .eq('recipient_id', user.id);

        if (normalizedMode === NOTIFICATION_QUERY_MODES.UNREAD) {
            query = query.is('read_at', null);
        }

        if (normalizedCursor) {
            query = query.or(
                `occurred_at.lt.${normalizedCursor.occurredAt},and(occurred_at.eq.${normalizedCursor.occurredAt},id.lt.${normalizedCursor.id})`,
            );
        }

        const { data, error } = await query
            .order('occurred_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(size + 1);

        if (error) throw error;

        const normalizedRows = normalizeRowsOrThrow(data);
        const hasMore = normalizedRows.length > size;
        const notifications = hasMore ? normalizedRows.slice(0, size) : normalizedRows;
        const oldest = notifications[notifications.length - 1] || null;

        return {
            notifications,
            hasMore,
            nextCursor: hasMore && oldest
                ? { occurredAt: oldest.occurredAt, id: oldest.id }
                : null,
            mode: normalizedMode,
            pageSize: size,
        };
    } catch (error) {
        throw toNotificationServiceError(error, NOTIFICATION_ERROR_CODES.QUERY);
    }
};

export const fetchUnseenNotificationCount = async () => {
    const user = await getAuthenticatedNotificationUser();

    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .is('seen_at', null);

        if (error) throw error;
        return Number.isInteger(count) && count >= 0 ? count : 0;
    } catch (error) {
        throw toNotificationServiceError(error, NOTIFICATION_ERROR_CODES.QUERY);
    }
};

const callNotificationRowRpc = async (rpcName, notificationId) => {
    const user = await getAuthenticatedNotificationUser();
    if (!isValidUuid(notificationId)) throw createInvalidInputError('notificationId');

    try {
        const { data, error } = await supabase.rpc(rpcName, {
            p_notification_id: notificationId,
        });
        if (error) throw error;
        return assertOwnNotification(normalizeRowsOrThrow([data])[0], user.id);
    } catch (error) {
        throw toNotificationServiceError(error, NOTIFICATION_ERROR_CODES.RPC);
    }
};

export const markNotificationSeen = (notificationId) => callNotificationRowRpc(
    'mark_notification_seen',
    notificationId,
);

export const markNotificationRead = (notificationId) => callNotificationRowRpc(
    'mark_notification_read',
    notificationId,
);

export const markNotificationsSeen = async (notificationIds = []) => {
    await getAuthenticatedNotificationUser();

    if (!Array.isArray(notificationIds)) throw createInvalidInputError('notificationIds');
    if (notificationIds.length === 0) return 0;
    if (notificationIds.length > NOTIFICATION_BATCH_MAX_SIZE) throw createInvalidInputError('notificationIds');

    const uniqueIds = new Set();
    notificationIds.forEach((notificationId) => {
        if (!isValidUuid(notificationId) || uniqueIds.has(notificationId)) {
            throw createInvalidInputError('notificationIds');
        }
        uniqueIds.add(notificationId);
    });

    try {
        const { data, error } = await supabase.rpc('mark_notifications_seen', {
            p_notification_ids: notificationIds,
        });
        if (error) throw error;
        if (!Number.isInteger(data) || data < 0) {
            throw new NotificationServiceError(
                NOTIFICATION_ERROR_CODES.MALFORMED_ROW,
                'Bildirim işlemi beklenmeyen bir yanıt döndürdü.',
                new Error('Invalid mark_notifications_seen result'),
            );
        }
        return data;
    } catch (error) {
        throw toNotificationServiceError(error, NOTIFICATION_ERROR_CODES.RPC);
    }
};

export const markAllNotificationsRead = async () => {
    await getAuthenticatedNotificationUser();

    try {
        const { data, error } = await supabase.rpc('mark_all_notifications_read', {});
        if (error) throw error;
        if (!Number.isInteger(data) || data < 0) {
            throw new NotificationServiceError(
                NOTIFICATION_ERROR_CODES.MALFORMED_ROW,
                'Bildirim işlemi beklenmeyen bir yanıt döndürdü.',
                new Error('Invalid mark_all_notifications_read result'),
            );
        }
        return data;
    } catch (error) {
        throw toNotificationServiceError(error, NOTIFICATION_ERROR_CODES.RPC);
    }
};
