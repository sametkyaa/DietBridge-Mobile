'use strict';

const { isValidUuid } = require('./notificationUtils');

const NOTIFICATION_REALTIME_DEBOUNCE_MS = 150;

const buildNotificationChannelConfig = (userId) => {
    if (!isValidUuid(userId)) return null;
    return {
        channelName: `mobile-notifications:${userId}`,
        filter: `recipient_id=eq.${userId}`,
    };
};

const normalizeSubscriptionStatus = (status) => {
    switch (status) {
        case 'SUBSCRIBED':
            return { status: 'connected', shouldRefresh: true };
        case 'CHANNEL_ERROR':
        case 'TIMED_OUT':
            return { status: 'degraded', shouldRefresh: false };
        case 'CLOSED':
            return { status: 'disconnected', shouldRefresh: false };
        default:
            return { status: 'connecting', shouldRefresh: false };
    }
};

const isNotificationRealtimeContextCurrent = ({ currentUserId, eventUserId } = {}) => (
    isValidUuid(currentUserId)
    && isValidUuid(eventUserId)
    && currentUserId === eventUserId
);

// Realtime only accelerates persisted refreshes. It never starts polling or
// creates replacement channels after a transport error.
const createNotificationRefreshScheduler = ({ delayMs = NOTIFICATION_REALTIME_DEBOUNCE_MS, onRefresh } = {}) => {
    let timer = null;
    let inFlight = false;
    let trailingRequested = false;
    let disposed = false;

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const run = () => {
        if (disposed) return;
        if (inFlight) {
            trailingRequested = true;
            return;
        }
        if (typeof onRefresh !== 'function') return;

        inFlight = true;
        let result;
        try {
            result = onRefresh();
        } catch (error) {
            result = Promise.reject(error);
        }

        Promise.resolve(result)
            .catch(() => undefined)
            .then(() => {
                inFlight = false;
                if (trailingRequested) {
                    trailingRequested = false;
                    notify();
                }
            });
    };

    const notify = () => {
        if (disposed) return;
        clearTimer();
        timer = setTimeout(() => {
            timer = null;
            run();
        }, delayMs);
    };

    const clearPending = () => {
        clearTimer();
        trailingRequested = false;
    };

    const dispose = () => {
        disposed = true;
        clearPending();
    };

    return { notify, clearPending, dispose };
};

module.exports = {
    NOTIFICATION_REALTIME_DEBOUNCE_MS,
    buildNotificationChannelConfig,
    normalizeSubscriptionStatus,
    isNotificationRealtimeContextCurrent,
    createNotificationRefreshScheduler,
};
