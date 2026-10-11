'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_EVENT_TYPES,
} = require('../../constants/notificationConstants');
const {
    buildNotificationRow,
    buildAppointmentRow,
    buildRelationshipRow,
} = require('./notificationTestFixtures.cjs');
const {
    buildNotificationPage,
    buildSupportedNotificationEventFilter,
    isUnsupportedNotificationRow,
    normalizeNotificationRow,
    partitionNotificationRows,
} = require('../notificationUtils');
const { getNotificationNavigationIntent } = require('../notificationNavigationPolicy.cjs');

const buildUnknownCategoryRow = (overrides = {}) => buildNotificationRow({
    category: 'invite_code',
    event_type: 'connected',
    summary_key: 'invite_code_connected',
    conversation_id: null,
    event_count: 1,
    ...overrides,
});

const buildMixedRows = () => [
    buildNotificationRow({ id: 'a1111111-1111-4111-8111-111111111111', occurred_at: '2026-08-16T10:05:00Z' }),
    buildUnknownCategoryRow({ id: 'a2222222-2222-4222-8222-222222222222', occurred_at: '2026-08-16T10:04:00Z' }),
    buildAppointmentRow({ id: 'a3333333-3333-4333-8333-333333333333', occurred_at: '2026-08-16T10:03:00Z' }),
    buildUnknownCategoryRow({
        id: 'a4444444-4444-4444-8444-444444444444',
        occurred_at: '2026-08-16T10:02:00Z',
        event_type: 'quota_full',
    }),
    buildRelationshipRow({ id: 'a5555555-5555-4555-8555-555555555555', occurred_at: '2026-08-16T10:01:00Z' }),
];

test('rows with an unknown category or event are unsupported, not malformed', () => {
    assert.equal(isUnsupportedNotificationRow(buildUnknownCategoryRow()), true);
    assert.equal(isUnsupportedNotificationRow(buildAppointmentRow({ event_type: 'reminder_90m' })), true);
    assert.equal(isUnsupportedNotificationRow(buildNotificationRow({ event_type: 'opened' })), true);

    // Normalization itself still rejects them, as the existing contract requires.
    assert.equal(normalizeNotificationRow(buildUnknownCategoryRow()), null);
});

test('known-type rows with invalid fields and rows without identity stay malformed', () => {
    assert.equal(isUnsupportedNotificationRow(buildNotificationRow()), false);
    assert.equal(isUnsupportedNotificationRow(buildNotificationRow({ conversation_id: null })), false);
    assert.equal(isUnsupportedNotificationRow(buildRelationshipRow({ relationship_to_status: 'removed' })), false);
    assert.equal(isUnsupportedNotificationRow(buildUnknownCategoryRow({ id: 'not-a-uuid' })), false);
    assert.equal(isUnsupportedNotificationRow(buildUnknownCategoryRow({ recipient_id: null })), false);
    assert.equal(isUnsupportedNotificationRow(buildUnknownCategoryRow({ occurred_at: 'bad' })), false);
    assert.equal(isUnsupportedNotificationRow(buildUnknownCategoryRow({ category: 42 })), false);
    assert.equal(isUnsupportedNotificationRow(null), false);
    assert.equal(isUnsupportedNotificationRow([]), false);
});

test('an unknown category row is skipped while the other rows still render', () => {
    const result = partitionNotificationRows(buildMixedRows());

    assert.deepEqual(
        result.notifications.map((notification) => notification.category),
        [
            NOTIFICATION_CATEGORIES.CHAT_MESSAGE,
            NOTIFICATION_CATEGORIES.APPOINTMENT,
            NOTIFICATION_CATEGORIES.RELATIONSHIP,
        ],
    );
    assert.equal(result.unsupportedCount, 2);
    assert.equal(result.malformedCount, 0);
});

test('a malformed known-type row is still reported so the list fails closed', () => {
    const result = partitionNotificationRows([
        buildNotificationRow(),
        buildNotificationRow({ id: 'a6666666-6666-4666-8666-666666666666', conversation_id: null }),
    ]);

    assert.equal(result.notifications.length, 1);
    assert.equal(result.malformedCount, 1);
});

test('keyset pages skip unsupported rows without gaps, repeats, or a short hasMore', () => {
    const rawRows = buildMixedRows();
    const pageSize = 2;

    // First request returns limit(pageSize + 1) rows; the second row is unknown.
    const first = buildNotificationPage(rawRows.slice(0, pageSize + 1), pageSize);
    assert.deepEqual(first.notifications.map((row) => row.id), ['a1111111-1111-4111-8111-111111111111']);
    assert.equal(first.hasMore, true);
    assert.deepEqual(first.nextCursor, {
        occurredAt: '2026-08-16T10:04:00.000Z',
        id: 'a2222222-2222-4222-8222-222222222222',
    });

    const second = buildNotificationPage(rawRows.slice(2, 2 + pageSize + 1), pageSize);
    assert.deepEqual(second.notifications.map((row) => row.id), ['a3333333-3333-4333-8333-333333333333']);
    assert.equal(second.hasMore, true);
    assert.equal(second.nextCursor.id, 'a4444444-4444-4444-8444-444444444444');

    const third = buildNotificationPage(rawRows.slice(4), pageSize);
    assert.deepEqual(third.notifications.map((row) => row.id), ['a5555555-5555-4555-8555-555555555555']);
    assert.equal(third.hasMore, false);
    assert.equal(third.nextCursor, null);
    assert.equal(first.unsupportedCount + second.unsupportedCount + third.unsupportedCount, 2);
});

test('unseen count filter only counts category/event pairs this build can display', () => {
    const filter = buildSupportedNotificationEventFilter();
    assert.equal(
        filter,
        'and(category.eq.chat_message,event_type.in.(new_message)),'
        + 'and(category.eq.appointment,event_type.in.(created,updated,cancelled,assigned,removed_from_client,reminder_24h,reminder_1h)),'
        + 'and(category.eq.relationship,event_type.in.(request_pending,accepted,rejected,removed))',
    );

    // Local stand-in for the server count: unseen rows matching the same pairs.
    const pairs = [...filter.matchAll(/and\(category\.eq\.([a-z_]+),event_type\.in\.\(([a-z0-9_,]+)\)\)/g)]
        .map(([, category, events]) => [category, events.split(',')]);
    assert.deepEqual(pairs, [
        [NOTIFICATION_CATEGORIES.CHAT_MESSAGE, [...NOTIFICATION_EVENT_TYPES.CHAT_MESSAGE]],
        [NOTIFICATION_CATEGORIES.APPOINTMENT, [...NOTIFICATION_EVENT_TYPES.APPOINTMENT]],
        [NOTIFICATION_CATEGORIES.RELATIONSHIP, [...NOTIFICATION_EVENT_TYPES.RELATIONSHIP]],
    ]);
    const matchesFilter = (row) => pairs.some(([category, events]) => (
        row.category === category && events.includes(row.event_type)
    ));
    const unseenCount = buildMixedRows().filter((row) => row.seen_at === null && matchesFilter(row)).length;
    const visibleUnseen = partitionNotificationRows(buildMixedRows()).notifications
        .filter((notification) => notification.seenAt === null).length;

    assert.equal(unseenCount, 3);
    assert.equal(unseenCount, visibleUnseen);
});

test('opening an unknown-type notification resolves to a safe invalid intent', () => {
    assert.deepEqual(
        getNotificationNavigationIntent({ category: 'invite_code', eventType: 'connected' }),
        { kind: 'invalid', message: 'Bu bildirim artık görüntülenemiyor.' },
    );
});
