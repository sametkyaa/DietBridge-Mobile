'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_QUERY_MODES,
} = require('../../constants/notificationConstants');
const {
    buildNotificationRow,
    buildAppointmentRow,
    buildRelationshipRow,
} = require('./notificationTestFixtures.cjs');
const {
    buildNotificationChannelConfig,
    normalizeSubscriptionStatus,
    isNotificationRealtimeContextCurrent,
} = require('../notificationRealtimePolicy.cjs');
const {
    normalizeNotificationRow,
    normalizeNotificationCursor,
    mergeNotifications,
} = require('../notificationUtils');

test('maps valid Chat notification metadata without exposing a message body', () => {
    const model = normalizeNotificationRow(buildNotificationRow({ body: 'gizli mesaj' }));

    assert.equal(model.category, NOTIFICATION_CATEGORIES.CHAT_MESSAGE);
    assert.equal(model.eventType, 'new_message');
    assert.equal(model.recipientId, '11111111-1111-4111-8111-111111111111');
    assert.equal(model.conversationId, '22222222-2222-4222-8222-222222222222');
    assert.equal(Object.prototype.hasOwnProperty.call(model, 'body'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(model, 'messageText'), false);
});

test('maps valid appointment notification metadata', () => {
    const model = normalizeNotificationRow(buildAppointmentRow());

    assert.equal(model.category, NOTIFICATION_CATEGORIES.APPOINTMENT);
    assert.equal(model.eventType, 'created');
    assert.equal(model.appointmentId, '33333333-3333-4333-8333-333333333333');
    assert.equal(model.appointmentDate, '2026-08-20');
    assert.equal(model.appointmentTime, '10:30:00');
    assert.equal(model.appointmentStatus, 'upcoming');
});

test('maps valid relationship notification metadata', () => {
    const model = normalizeNotificationRow(buildRelationshipRow());

    assert.equal(model.category, NOTIFICATION_CATEGORIES.RELATIONSHIP);
    assert.equal(model.eventType, 'accepted');
    assert.equal(model.dietitianClientId, '44444444-4444-4444-8444-444444444444');
    assert.equal(model.relationshipFromStatus, 'pending');
    assert.equal(model.relationshipToStatus, 'active');
});

test('rejects malformed category, unsupported event, and invalid source fields safely', () => {
    assert.equal(normalizeNotificationRow(buildNotificationRow({ category: 'meal_activity' })), null);
    assert.equal(normalizeNotificationRow(buildNotificationRow({ event_type: 'opened' })), null);
    assert.equal(normalizeNotificationRow(buildNotificationRow({ conversation_id: null })), null);
    assert.equal(normalizeNotificationRow(buildRelationshipRow({ relationship_to_status: 'removed' })), null);
});

test('rejects read rows that do not preserve the seen/read invariant', () => {
    assert.equal(normalizeNotificationRow(buildNotificationRow({ read_at: '2026-08-16T10:01:00Z' })), null);
});

test('normalizes keyset cursor and rejects invalid cursors', () => {
    assert.deepEqual(
        normalizeNotificationCursor({
            occurredAt: '2026-08-16T10:00:00+03:00',
            id: '55555555-5555-4555-8555-555555555555',
        }),
        {
            occurredAt: '2026-08-16T07:00:00.000Z',
            id: '55555555-5555-4555-8555-555555555555',
        },
    );
    assert.equal(normalizeNotificationCursor({ occurredAt: 'bad', id: 'bad' }), null);
});

test('merges realtime UPDATE by notification id, reorders re-arms, and does not duplicate', () => {
    const initial = normalizeNotificationRow(buildNotificationRow({
        occurred_at: '2026-08-16T10:00:00Z',
        seen_at: '2026-08-16T10:00:05Z',
        read_at: '2026-08-16T10:00:06Z',
    }));
    const newer = normalizeNotificationRow(buildNotificationRow({
        occurred_at: '2026-08-16T10:02:00Z',
        seen_at: null,
        read_at: null,
        event_count: 1,
    }));

    const merged = mergeNotifications([initial], [newer]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, initial.id);
    assert.equal(merged[0].occurredAt, '2026-08-16T10:02:00.000Z');
    assert.equal(merged[0].seenAt, null);
    assert.equal(merged[0].readAt, null);
});

test('unread merge removes a row when an UPDATE marks it read', () => {
    const unread = normalizeNotificationRow(buildNotificationRow());
    const read = normalizeNotificationRow(buildNotificationRow({
        seen_at: '2026-08-16T10:01:00Z',
        read_at: '2026-08-16T10:01:00Z',
    }));

    assert.deepEqual(mergeNotifications([unread], [read], NOTIFICATION_QUERY_MODES.UNREAD), []);
});

test('builds one recipient-filtered notification channel and session guards events', () => {
    const userId = '11111111-1111-4111-8111-111111111111';
    assert.deepEqual(buildNotificationChannelConfig(userId), {
        channelName: `mobile-notifications:${userId}`,
        filter: `recipient_id=eq.${userId}`,
    });
    assert.equal(buildNotificationChannelConfig('not-a-uuid'), null);
    assert.equal(isNotificationRealtimeContextCurrent({ currentUserId: userId, eventUserId: userId }), true);
    assert.equal(isNotificationRealtimeContextCurrent({ currentUserId: userId, eventUserId: '22222222-2222-4222-8222-222222222222' }), false);
});

test('normalizes Realtime lifecycle status without spawning replacement channels', () => {
    assert.deepEqual(normalizeSubscriptionStatus('SUBSCRIBED'), { status: 'connected', shouldRefresh: true });
    assert.deepEqual(normalizeSubscriptionStatus('CHANNEL_ERROR'), { status: 'degraded', shouldRefresh: false });
    assert.deepEqual(normalizeSubscriptionStatus('CLOSED'), { status: 'disconnected', shouldRefresh: false });
});
