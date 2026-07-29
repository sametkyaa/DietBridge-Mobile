'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    isValidUuid,
    normalizeChatBody,
    normalizeChatConversationRow,
    normalizeChatMessageRow,
    normalizeChatReadStateRow,
    mergeCanonicalChatMessages,
    isValidChatCursor,
    isCanonicalChatMessage,
} = require('../chatMessageUtils');

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';
const UUID_C = '33333333-3333-4333-8333-333333333333';
const UUID_D = '44444444-4444-4444-8444-444444444444';

const buildMessage = (overrides = {}) => ({
    id: UUID_A,
    conversationId: UUID_B,
    senderId: UUID_C,
    clientMessageId: UUID_D,
    body: 'Merhaba',
    createdAt: '2026-07-20T10:00:00.000Z',
    isOwn: false,
    deliveryState: 'sent',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    ...overrides,
});

test('isValidUuid accepts RFC UUIDs and rejects other shapes', () => {
    assert.equal(isValidUuid(UUID_A), true);
    assert.equal(isValidUuid(UUID_A.toUpperCase()), true);
    assert.equal(isValidUuid('not-a-uuid'), false);
    assert.equal(isValidUuid(''), false);
    assert.equal(isValidUuid(null), false);
    assert.equal(isValidUuid(123), false);
});

test('normalizeChatBody trims and preserves newlines', () => {
    assert.equal(normalizeChatBody('  merhaba\nnasılsın  '), 'merhaba\nnasılsın');
    assert.equal(normalizeChatBody('x'), 'x');
});

test('normalizeChatBody rejects non-string, empty and whitespace-only input', () => {
    assert.throws(() => normalizeChatBody(null));
    assert.throws(() => normalizeChatBody(42));
    assert.throws(() => normalizeChatBody(''));
    assert.throws(() => normalizeChatBody('   \n\t  '));
});

test('normalizeChatBody rejects over-limit input instead of truncating', () => {
    const overLimit = 'a'.repeat(4001);
    assert.throws(() => normalizeChatBody(overLimit));
    assert.equal(normalizeChatBody('a'.repeat(4000)).length, 4000);
});

test('normalizeChatConversationRow maps canonical columns and rejects invalid rows', () => {
    const row = {
        id: UUID_A,
        dietitian_client_id: UUID_B,
        dietitian_id: UUID_C,
        client_id: UUID_D,
        last_message_id: UUID_D,
        last_message_at: '2026-07-20T10:00:00Z',
        created_at: '2026-07-01T08:00:00Z',
        updated_at: '2026-07-20T10:00:00Z',
    };

    const conversation = normalizeChatConversationRow(row);
    assert.equal(conversation.id, UUID_A);
    assert.equal(conversation.relationId, UUID_B);
    assert.equal(conversation.dietitianId, UUID_C);
    assert.equal(conversation.clientId, UUID_D);
    assert.equal(conversation.lastMessageId, UUID_D);
    assert.equal(conversation.lastMessageAt, '2026-07-20T10:00:00.000Z');

    assert.equal(normalizeChatConversationRow(null), null);
    assert.equal(normalizeChatConversationRow({ ...row, id: 'nope' }), null);
    // last-message pair must be both set or both null
    assert.equal(normalizeChatConversationRow({ ...row, last_message_at: null }), null);

    const emptyConversation = normalizeChatConversationRow({
        ...row,
        last_message_id: null,
        last_message_at: null,
    });
    assert.equal(emptyConversation.lastMessageId, null);
    assert.equal(emptyConversation.lastMessageAt, null);
});

test('normalizeChatMessageRow rejects legacy rows and never falls back to message_text', () => {
    const legacyRow = {
        id: UUID_A,
        conversation_id: null,
        sender_id: UUID_C,
        client_message_id: null,
        body: null,
        message_text: 'legacy içerik',
        created_at: '2026-01-01T00:00:00Z',
    };
    assert.equal(normalizeChatMessageRow(legacyRow, UUID_C), null);

    const canonical = {
        id: UUID_A,
        conversation_id: UUID_B,
        sender_id: UUID_C,
        client_message_id: UUID_D,
        body: 'Merhaba',
        created_at: '2026-07-20T10:00:00Z',
        deleted_at: null,
        deleted_by: null,
    };
    const own = normalizeChatMessageRow(canonical, UUID_C);
    assert.equal(own.isOwn, true);
    assert.equal(own.deliveryState, 'sent');
    assert.equal(own.clientMessageId, UUID_D);

    const other = normalizeChatMessageRow(canonical, UUID_D);
    assert.equal(other.isOwn, false);

    assert.equal(normalizeChatMessageRow({ ...canonical, body: '   ' }, UUID_C), null);
    assert.equal(normalizeChatMessageRow({ ...canonical, body: 5 }, UUID_C), null);
    assert.equal(normalizeChatMessageRow({ ...canonical, client_message_id: 'bad' }, UUID_C), null);

    assert.equal(normalizeChatMessageRow({ ...canonical, client_message_id: null }, UUID_C), null);
});

test('normalizeChatMessageRow maps valid soft-delete rows to tombstones', () => {
    const deleted = normalizeChatMessageRow({
        id: UUID_A,
        conversation_id: UUID_B,
        sender_id: UUID_C,
        client_message_id: UUID_D,
        body: null,
        created_at: '2026-07-20T10:00:00Z',
        deleted_at: '2026-07-20T10:05:00Z',
        deleted_by: UUID_C,
    }, UUID_C);
    assert.equal(deleted.isDeleted, true);
    assert.equal(deleted.body, null);
    assert.equal(deleted.isOwn, true);
    assert.equal(isCanonicalChatMessage(deleted), true);

    assert.equal(normalizeChatMessageRow({
        id: UUID_A,
        conversation_id: UUID_B,
        sender_id: UUID_C,
        client_message_id: UUID_D,
        body: 'Eski içerik',
        created_at: '2026-07-20T10:00:00Z',
        deleted_at: '2026-07-20T10:05:00Z',
        deleted_by: UUID_C,
    }, UUID_C), null);
});

test('normalizeChatReadStateRow maps canonical read state columns', () => {
    const row = {
        conversation_id: UUID_A,
        user_id: UUID_B,
        last_delivered_message_id: UUID_C,
        last_delivered_at: '2026-07-20T10:00:00Z',
        last_read_message_id: UUID_C,
        last_read_at: '2026-07-20T10:00:00Z',
        created_at: '2026-07-01T08:00:00Z',
        updated_at: '2026-07-20T10:00:00Z',
    };

    const state = normalizeChatReadStateRow(row);
    assert.equal(state.conversationId, UUID_A);
    assert.equal(state.userId, UUID_B);
    assert.equal(state.lastDeliveredMessageId, UUID_C);
    assert.equal(state.lastDeliveredAt, '2026-07-20T10:00:00.000Z');
    assert.equal(state.lastReadMessageId, UUID_C);
    assert.equal(state.updatedAt, '2026-07-20T10:00:00.000Z');

    assert.equal(normalizeChatReadStateRow({ ...row, user_id: 'bad' }), null);
    assert.equal(normalizeChatReadStateRow(null), null);
});

test('mergeCanonicalChatMessages dedupes by server id and non-empty clientMessageId', () => {
    const serverCopy = buildMessage();
    const optimisticCopy = buildMessage({ id: UUID_D, createdAt: '2026-07-20T10:00:01.000Z' });

    const merged = mergeCanonicalChatMessages([optimisticCopy], [serverCopy]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, UUID_A);

    const sameServerId = mergeCanonicalChatMessages(
        [serverCopy],
        [buildMessage({ body: 'Güncel' })],
    );
    assert.equal(sameServerId.length, 1);
    assert.equal(sameServerId[0].body, 'Güncel');
});

test('mergeCanonicalChatMessages applies realtime soft-delete updates by id without duplicates', () => {
    const original = buildMessage();
    const tombstone = buildMessage({
        body: null,
        isDeleted: true,
        deletedAt: '2026-07-20T10:05:00.000Z',
        deletedBy: UUID_C,
    });
    const merged = mergeCanonicalChatMessages([original], [tombstone]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].isDeleted, true);
    assert.equal(merged[0].body, null);
});

test('mergeCanonicalChatMessages rejects legacy null clientMessageIds', () => {
    const first = buildMessage({ id: UUID_A, clientMessageId: null });
    const second = buildMessage({ id: UUID_B, clientMessageId: null, createdAt: '2026-07-20T10:00:02.000Z' });

    const merged = mergeCanonicalChatMessages([first], [second]);
    assert.equal(merged.length, 0);
});

test('mergeCanonicalChatMessages sorts createdAt ASC then id ASC and does not mutate inputs', () => {
    const later = buildMessage({ id: UUID_B, clientMessageId: UUID_A, createdAt: '2026-07-20T10:00:02.000Z' });
    const earlier = buildMessage({ id: UUID_C, clientMessageId: '55555555-5555-4555-8555-555555555555', createdAt: '2026-07-20T10:00:01.000Z' });
    const existing = [later];
    const incoming = [earlier];

    const merged = mergeCanonicalChatMessages(existing, incoming);
    assert.deepEqual(merged.map((message) => message.id), [UUID_C, UUID_B]);
    assert.equal(existing.length, 1);
    assert.equal(incoming.length, 1);
    assert.equal(existing[0].id, UUID_B);
});

test('mergeCanonicalChatMessages drops invalid entries safely', () => {
    const valid = buildMessage();
    const merged = mergeCanonicalChatMessages([valid, null, { id: 'bad' }], undefined);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, valid.id);
});

test('isValidChatCursor validates the keyset cursor shape', () => {
    assert.equal(isValidChatCursor({ createdAt: '2026-07-20T10:00:00Z', id: UUID_A }), true);
    assert.equal(isValidChatCursor({ createdAt: 'not-a-date', id: UUID_A }), false);
    assert.equal(isValidChatCursor({ createdAt: '2026-07-20T10:00:00Z', id: 'bad' }), false);
    assert.equal(isValidChatCursor(null), false);
});
