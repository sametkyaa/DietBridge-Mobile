'use strict';

const {
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_EVENT_TYPES,
    NOTIFICATION_QUERY_MODES,
} = require('../constants/notificationConstants');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RELATIONSHIP_STATUSES = new Set(['active', 'pending', 'rejected', 'removed']);
const APPOINTMENT_STATUSES = new Set(['upcoming', 'completed', 'cancelled']);

const APPOINTMENT_SUMMARY_KEYS = Object.freeze({
    created: 'appointment_created',
    updated: 'appointment_updated',
    cancelled: 'appointment_cancelled',
    assigned: 'appointment_assigned',
    removed_from_client: 'appointment_removed_from_client',
    reminder_24h: 'appointment_reminder_24h',
    reminder_1h: 'appointment_reminder_1h',
});

const RELATIONSHIP_SUMMARY_KEYS = Object.freeze({
    request_pending: 'relationship_request_pending',
    accepted: 'relationship_accepted',
    rejected: 'relationship_rejected',
    removed: 'relationship_removed',
});

const isValidUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

const normalizeIsoTimestamp = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
};

const normalizeOptionalUuid = (value) => {
    if (value === null || value === undefined) return null;
    return isValidUuid(value) ? value : undefined;
};

const normalizeOptionalTimestamp = (value) => {
    if (value === null || value === undefined) return null;
    return normalizeIsoTimestamp(value) || undefined;
};

const normalizeOptionalText = (value, maxLength = 120) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > maxLength) return undefined;
    return trimmed;
};

const isIsoDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = Date.parse(`${value}T00:00:00Z`);
    return !Number.isNaN(parsed) && new Date(parsed).toISOString().slice(0, 10) === value;
};

const isTimeWithoutZone = (value) => (
    typeof value === 'string'
    && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(value)
);

const isSupportedEvent = (category, eventType) => {
    if (category === NOTIFICATION_CATEGORIES.CHAT_MESSAGE) {
        return NOTIFICATION_EVENT_TYPES.CHAT_MESSAGE.includes(eventType);
    }
    if (category === NOTIFICATION_CATEGORIES.APPOINTMENT) {
        return NOTIFICATION_EVENT_TYPES.APPOINTMENT.includes(eventType);
    }
    if (category === NOTIFICATION_CATEGORIES.RELATIONSHIP) {
        return NOTIFICATION_EVENT_TYPES.RELATIONSHIP.includes(eventType);
    }
    return false;
};

const hasOnlyNullValues = (values) => values.every((value) => value === null);

const normalizeNotificationRow = (row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;

    const id = row.id;
    const recipientId = row.recipient_id;
    const category = row.category;
    const eventType = row.event_type;
    const summaryKey = row.summary_key;
    const actorId = normalizeOptionalUuid(row.actor_id);
    const conversationId = normalizeOptionalUuid(row.conversation_id);
    const appointmentId = normalizeOptionalUuid(row.appointment_id);
    const dietitianClientId = normalizeOptionalUuid(row.dietitian_client_id);
    const actorDisplayName = normalizeOptionalText(row.actor_display_name);
    const appointmentTitleSnapshot = normalizeOptionalText(row.appointment_title_snapshot, 120);
    const appointmentDate = row.appointment_date === null || row.appointment_date === undefined
        ? null
        : row.appointment_date;
    const appointmentTime = row.appointment_time === null || row.appointment_time === undefined
        ? null
        : row.appointment_time;
    const appointmentStatus = row.appointment_status === null || row.appointment_status === undefined
        ? null
        : row.appointment_status;
    const relationshipFromStatus = row.relationship_from_status === null || row.relationship_from_status === undefined
        ? null
        : row.relationship_from_status;
    const relationshipToStatus = row.relationship_to_status === null || row.relationship_to_status === undefined
        ? null
        : row.relationship_to_status;
    const eventCount = row.event_count;
    const occurredAt = normalizeIsoTimestamp(row.occurred_at);
    const seenAt = normalizeOptionalTimestamp(row.seen_at);
    const readAt = normalizeOptionalTimestamp(row.read_at);
    const createdAt = normalizeIsoTimestamp(row.created_at);
    const updatedAt = normalizeIsoTimestamp(row.updated_at);

    if (
        !isValidUuid(id)
        || !isValidUuid(recipientId)
        || typeof category !== 'string'
        || typeof eventType !== 'string'
        || !isSupportedEvent(category, eventType)
        || typeof summaryKey !== 'string'
        || !summaryKey.trim()
        || actorId === undefined
        || conversationId === undefined
        || appointmentId === undefined
        || dietitianClientId === undefined
        || actorDisplayName === undefined
        || appointmentTitleSnapshot === undefined
        || !occurredAt
        || seenAt === undefined
        || readAt === undefined
        || !createdAt
        || !updatedAt
        || !Number.isInteger(eventCount)
        || eventCount < 1
        || (readAt !== null && seenAt === null)
    ) {
        return null;
    }

    if (category === NOTIFICATION_CATEGORIES.CHAT_MESSAGE) {
        if (
            eventType !== 'new_message'
            || summaryKey !== 'chat_new_message'
            || !conversationId
            || !hasOnlyNullValues([
                appointmentId,
                dietitianClientId,
                appointmentTitleSnapshot,
                appointmentDate,
                appointmentTime,
                appointmentStatus,
                relationshipFromStatus,
                relationshipToStatus,
            ])
        ) return null;
    }

    if (category === NOTIFICATION_CATEGORIES.APPOINTMENT) {
        if (
            !appointmentId
            || !Object.prototype.hasOwnProperty.call(APPOINTMENT_SUMMARY_KEYS, eventType)
            || summaryKey !== APPOINTMENT_SUMMARY_KEYS[eventType]
            || !isIsoDate(appointmentDate)
            || !isTimeWithoutZone(appointmentTime)
            || !APPOINTMENT_STATUSES.has(appointmentStatus)
            || !hasOnlyNullValues([conversationId, dietitianClientId, relationshipFromStatus, relationshipToStatus])
        ) return null;
    }

    if (category === NOTIFICATION_CATEGORIES.RELATIONSHIP) {
        if (
            !dietitianClientId
            || !Object.prototype.hasOwnProperty.call(RELATIONSHIP_SUMMARY_KEYS, eventType)
            || summaryKey !== RELATIONSHIP_SUMMARY_KEYS[eventType]
            || !RELATIONSHIP_STATUSES.has(relationshipFromStatus) && relationshipFromStatus !== null
            || !RELATIONSHIP_STATUSES.has(relationshipToStatus) && relationshipToStatus !== null
            || !hasOnlyNullValues([
                conversationId,
                appointmentId,
                appointmentTitleSnapshot,
                appointmentDate,
                appointmentTime,
                appointmentStatus,
            ])
        ) return null;

        const validTransition = (
            (eventType === 'request_pending'
                && relationshipToStatus === 'pending'
                && (relationshipFromStatus === null || relationshipFromStatus === 'rejected' || relationshipFromStatus === 'removed'))
            || (eventType === 'accepted'
                && relationshipFromStatus === 'pending'
                && relationshipToStatus === 'active')
            || (eventType === 'rejected'
                && relationshipFromStatus === 'pending'
                && relationshipToStatus === 'rejected')
            || (eventType === 'removed'
                && relationshipFromStatus === 'active'
                && relationshipToStatus === 'removed')
        );
        if (!validTransition) return null;
    }

    return {
        id,
        recipientId,
        category,
        eventType,
        actorId,
        actorDisplayName,
        conversationId,
        appointmentId,
        dietitianClientId,
        summaryKey,
        appointmentTitleSnapshot,
        appointmentDate,
        appointmentTime,
        appointmentStatus,
        relationshipFromStatus,
        relationshipToStatus,
        eventCount,
        occurredAt,
        seenAt,
        readAt,
        createdAt,
        updatedAt,
    };
};

const normalizeNotificationCursor = (cursor) => {
    if (cursor === null || cursor === undefined) return null;
    if (!cursor || typeof cursor !== 'object') return null;
    const occurredAt = normalizeIsoTimestamp(cursor.occurredAt);
    if (!occurredAt || !isValidUuid(cursor.id)) return null;
    return { occurredAt, id: cursor.id };
};

const compareNotificationsNewestFirst = (left, right) => {
    const timeDifference = (Date.parse(right.occurredAt) || 0) - (Date.parse(left.occurredAt) || 0);
    if (timeDifference !== 0) return timeDifference;
    if (left.id < right.id) return 1;
    if (left.id > right.id) return -1;
    return 0;
};

const mergeNotifications = (existingNotifications, incomingNotifications, mode = NOTIFICATION_QUERY_MODES.ALL) => {
    const byId = new Map();
    const push = (notification) => {
        if (!notification?.id) return;
        if (mode === NOTIFICATION_QUERY_MODES.UNREAD && notification.readAt !== null) {
            byId.delete(notification.id);
            return;
        }
        byId.set(notification.id, notification);
    };

    (Array.isArray(existingNotifications) ? existingNotifications : []).forEach(push);
    (Array.isArray(incomingNotifications) ? incomingNotifications : []).forEach(push);

    return [...byId.values()].sort(compareNotificationsNewestFirst);
};

const isNotificationQueryMode = (mode) => (
    mode === NOTIFICATION_QUERY_MODES.ALL || mode === NOTIFICATION_QUERY_MODES.UNREAD
);

module.exports = {
    isValidUuid,
    normalizeIsoTimestamp,
    isSupportedEvent,
    normalizeNotificationRow,
    normalizeNotificationCursor,
    compareNotificationsNewestFirst,
    mergeNotifications,
    isNotificationQueryMode,
    APPOINTMENT_SUMMARY_KEYS,
    RELATIONSHIP_SUMMARY_KEYS,
};
