'use strict';

const NOTIFICATION_DEFAULT_PAGE_SIZE = 25;
const NOTIFICATION_MAX_PAGE_SIZE = 50;
const NOTIFICATION_BATCH_MAX_SIZE = 100;

const NOTIFICATION_QUERY_MODES = Object.freeze({
    ALL: 'all',
    UNREAD: 'unread',
});

const NOTIFICATION_CATEGORIES = Object.freeze({
    CHAT_MESSAGE: 'chat_message',
    APPOINTMENT: 'appointment',
    RELATIONSHIP: 'relationship',
});

const NOTIFICATION_EVENT_TYPES = Object.freeze({
    CHAT_MESSAGE: Object.freeze(['new_message']),
    APPOINTMENT: Object.freeze(['created', 'updated', 'cancelled', 'assigned', 'removed_from_client', 'reminder_24h', 'reminder_1h']),
    RELATIONSHIP: Object.freeze(['request_pending', 'accepted', 'rejected', 'removed']),
});

const NOTIFICATION_SELECT_COLUMNS = [
    'id',
    'recipient_id',
    'category',
    'event_type',
    'aggregation_key',
    'actor_id',
    'actor_display_name',
    'conversation_id',
    'appointment_id',
    'dietitian_client_id',
    'summary_key',
    'appointment_title_snapshot',
    'appointment_date',
    'appointment_time',
    'appointment_status',
    'relationship_from_status',
    'relationship_to_status',
    'event_count',
    'occurred_at',
    'seen_at',
    'read_at',
    'created_at',
    'updated_at',
].join(', ');

module.exports = {
    NOTIFICATION_DEFAULT_PAGE_SIZE,
    NOTIFICATION_MAX_PAGE_SIZE,
    NOTIFICATION_BATCH_MAX_SIZE,
    NOTIFICATION_QUERY_MODES,
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_EVENT_TYPES,
    NOTIFICATION_SELECT_COLUMNS,
};
