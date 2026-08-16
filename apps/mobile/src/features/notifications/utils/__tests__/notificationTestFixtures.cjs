'use strict';

const BASE = {
    id: '55555555-5555-4555-8555-555555555555',
    recipient_id: '11111111-1111-4111-8111-111111111111',
    category: 'chat_message',
    event_type: 'new_message',
    aggregation_key: 'chat:22222222-2222-4222-8222-222222222222',
    actor_id: '66666666-6666-4666-8666-666666666666',
    actor_display_name: 'Mebrure Kaya',
    conversation_id: '22222222-2222-4222-8222-222222222222',
    appointment_id: null,
    dietitian_client_id: null,
    summary_key: 'chat_new_message',
    appointment_title_snapshot: null,
    appointment_date: null,
    appointment_time: null,
    appointment_status: null,
    relationship_from_status: null,
    relationship_to_status: null,
    event_count: 3,
    occurred_at: '2026-08-16T10:00:00Z',
    seen_at: null,
    read_at: null,
    created_at: '2026-08-16T09:59:00Z',
    updated_at: '2026-08-16T10:00:00Z',
};

const buildNotificationRow = (overrides = {}) => ({ ...BASE, ...overrides });

const buildAppointmentRow = (overrides = {}) => buildNotificationRow({
    category: 'appointment',
    event_type: 'created',
    aggregation_key: 'appointment:33333333-3333-4333-8333-333333333333',
    summary_key: 'appointment_created',
    conversation_id: null,
    appointment_id: '33333333-3333-4333-8333-333333333333',
    appointment_title_snapshot: 'Kontrol randevusu',
    appointment_date: '2026-08-20',
    appointment_time: '10:30:00',
    appointment_status: 'upcoming',
    event_count: 1,
    ...overrides,
});

const buildRelationshipRow = (overrides = {}) => buildNotificationRow({
    category: 'relationship',
    event_type: 'accepted',
    aggregation_key: 'relationship:44444444-4444-4444-8444-444444444444',
    summary_key: 'relationship_accepted',
    conversation_id: null,
    dietitian_client_id: '44444444-4444-4444-8444-444444444444',
    relationship_from_status: 'pending',
    relationship_to_status: 'active',
    event_count: 1,
    ...overrides,
});

module.exports = {
    buildNotificationRow,
    buildAppointmentRow,
    buildRelationshipRow,
};
