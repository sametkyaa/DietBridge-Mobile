'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { NOTIFICATION_QUERY_MODES } = require('../../constants/notificationConstants');
const { buildNotificationRow } = require('./notificationTestFixtures.cjs');
const {
    normalizeNotificationRow,
    normalizeNotificationCursor,
    mergeNotifications,
} = require('../notificationUtils');

const buildMockRepository = (rawRows) => {
    const rows = rawRows
        .map(normalizeNotificationRow)
        .filter(Boolean)
        .sort((left, right) => (
            right.occurredAt.localeCompare(left.occurredAt)
            || right.id.localeCompare(left.id)
        ));

    return {
        fetchPage: ({ cursor = null, mode = NOTIFICATION_QUERY_MODES.ALL, pageSize = 25 } = {}) => {
            const normalizedCursor = cursor ? normalizeNotificationCursor(cursor) : null;
            const filtered = rows.filter((row) => mode !== NOTIFICATION_QUERY_MODES.UNREAD || row.readAt === null);
            const afterCursor = normalizedCursor
                ? filtered.filter((row) => (
                    row.occurredAt < normalizedCursor.occurredAt
                    || (row.occurredAt === normalizedCursor.occurredAt && row.id < normalizedCursor.id)
                ))
                : filtered;
            const limited = afterCursor.slice(0, pageSize + 1);
            const page = limited.slice(0, pageSize);
            const last = page[page.length - 1] || null;
            return {
                notifications: page,
                hasMore: limited.length > pageSize,
                nextCursor: limited.length > pageSize && last
                    ? { occurredAt: last.occurredAt, id: last.id }
                    : null,
            };
        },
        unseenCount: () => rows.filter((row) => row.seenAt === null).length,
    };
};

test('controlled local repository proves equal-timestamp keyset pages have no duplicates or gaps', () => {
    const rows = [
        buildNotificationRow({ id: '55555555-5555-4555-8555-555555555555', occurred_at: '2026-08-16T10:00:00Z' }),
        buildNotificationRow({ id: '66666666-6666-4666-8666-666666666666', occurred_at: '2026-08-16T10:00:00Z' }),
        buildNotificationRow({ id: '77777777-7777-4777-8777-777777777777', occurred_at: '2026-08-16T09:59:00Z' }),
    ];
    const repository = buildMockRepository(rows);

    const first = repository.fetchPage({ pageSize: 2 });
    const second = repository.fetchPage({ pageSize: 2, cursor: first.nextCursor });
    const ids = [...first.notifications, ...second.notifications].map((row) => row.id);

    assert.deepEqual(ids, [
        '66666666-6666-4666-8666-666666666666',
        '55555555-5555-4555-8555-555555555555',
        '77777777-7777-4777-8777-777777777777',
    ]);
    assert.equal(new Set(ids).size, ids.length);
});

test('controlled local repository keeps unseen count separate from unread filter', () => {
    const repository = buildMockRepository([
        buildNotificationRow({ seen_at: null, read_at: null }),
        buildNotificationRow({ id: '66666666-6666-4666-8666-666666666666', seen_at: '2026-08-16T10:01:00Z', read_at: null }),
        buildNotificationRow({ id: '77777777-7777-4777-8777-777777777777', seen_at: '2026-08-16T10:02:00Z', read_at: '2026-08-16T10:02:00Z' }),
    ]);

    assert.equal(repository.unseenCount(), 1);
    assert.equal(repository.fetchPage({ mode: NOTIFICATION_QUERY_MODES.UNREAD }).notifications.length, 2);
});

test('controlled realtime UPDATE replaces one row, re-arms it, and preserves one state item', () => {
    const existing = normalizeNotificationRow(buildNotificationRow({
        seen_at: '2026-08-16T10:00:00Z',
        read_at: '2026-08-16T10:00:00Z',
    }));
    const rearmed = normalizeNotificationRow(buildNotificationRow({
        occurred_at: '2026-08-16T10:03:00Z',
        seen_at: null,
        read_at: null,
    }));
    const state = mergeNotifications([existing], [rearmed]);

    assert.equal(state.length, 1);
    assert.equal(state[0].id, existing.id);
    assert.equal(state[0].seenAt, null);
    assert.equal(state[0].readAt, null);
    assert.equal(state[0].occurredAt, '2026-08-16T10:03:00.000Z');
});
