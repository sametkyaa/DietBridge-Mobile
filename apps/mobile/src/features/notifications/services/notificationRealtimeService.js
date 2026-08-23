import { supabase } from '../../../lib/supabaseClient';
import {
    getAuthenticatedNotificationUser,
    NotificationServiceError,
    NOTIFICATION_ERROR_CODES,
} from './notificationService';
import { normalizeNotificationRow } from '../utils/notificationUtils';
import {
    buildNotificationChannelConfig,
    normalizeSubscriptionStatus,
} from '../utils/notificationRealtimePolicy.cjs';

const createNoopSubscription = () => ({
    ready: Promise.resolve(null),
    unsubscribe: async () => undefined,
});

const createSubscriptionCleanup = (channel) => {
    let removal = null;
    return {
        unsubscribe: async () => {
            if (!removal) {
                removal = Promise.resolve(supabase.removeChannel(channel))
                    .then(() => undefined)
                    .catch(() => undefined);
            }
            return removal;
        },
    };
};

// Auth is resolved inside the service. expectedUserId is only a stale-session
// guard and never becomes the authorization/filter source by itself.
export const subscribeToNotificationChanges = ({
    expectedUserId,
    onNotification,
    onStatus,
    onReconcileRequired,
    onError,
} = {}) => {
    if (typeof onNotification !== 'function') return createNoopSubscription();

    let active = true;
    let channel = null;
    let cleanup = null;

    const ready = (async () => {
        try {
            const user = await getAuthenticatedNotificationUser();
            if (!active) return null;
            if (expectedUserId && expectedUserId !== user.id) {
                throw new NotificationServiceError(
                    NOTIFICATION_ERROR_CODES.UNAUTHENTICATED,
                    'Oturum değişti. Bildirimler yeniden yüklenmeli.',
                    new Error('Notification realtime session mismatch'),
                );
            }

            const config = buildNotificationChannelConfig(user.id);
            if (!config) throw new Error('Invalid authenticated notification user id');

            const handlePayload = (payload) => {
                if (!active) return;
                const notification = normalizeNotificationRow(payload?.new);
                if (!notification || notification.recipientId !== user.id) {
                    onError?.(new NotificationServiceError(
                        NOTIFICATION_ERROR_CODES.MALFORMED_ROW,
                        'Bildirim verisi geçersiz olduğu için güvenli şekilde gösterilemiyor.',
                        new Error('Malformed notification realtime payload'),
                    ));
                    return;
                }
                try {
                    onNotification(notification);
                    onReconcileRequired?.();
                } catch (error) {
                    onError?.(error);
                }
            };

            channel = supabase
                .channel(config.channelName)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: config.filter,
                }, handlePayload)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: config.filter,
                }, handlePayload);

            channel.subscribe((status) => {
                if (!active) return;
                const normalized = normalizeSubscriptionStatus(status);
                onStatus?.(normalized);
                if (normalized.shouldRefresh) onReconcileRequired?.();
            });

            cleanup = createSubscriptionCleanup(channel);
            return channel;
        } catch (error) {
            if (active) onError?.(error);
            return null;
        }
    })();

    return {
        ready,
        unsubscribe: async () => {
            active = false;
            await ready;
            return cleanup?.unsubscribe?.();
        },
    };
};
