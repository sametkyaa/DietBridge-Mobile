'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveRealtimeMessageAction } = require('../chatRealtimePolicy');
const { normalizeChatMessageRow } = require('../chatMessageUtils');

const ids = {
    conversation: '11111111-1111-4111-8111-111111111111',
    other: '99999999-9999-4999-8999-999999999999',
    message: '22222222-2222-4222-8222-222222222222',
    sender: '33333333-3333-4333-8333-333333333333',
    clientMessage: '44444444-4444-4444-8444-444444444444',
    attachment: '55555555-5555-4555-8555-555555555555',
    intent: '66666666-6666-4666-8666-666666666666',
    object: '77777777-7777-4777-8777-777777777777',
};
const objectPath = `pending/${ids.intent}/${ids.object}.jpg`;

const textRow = (overrides = {}) => ({
    id: ids.message,
    conversation_id: ids.conversation,
    sender_id: ids.sender,
    client_message_id: ids.clientMessage,
    body: 'Merhaba',
    message_kind: 'text',
    created_at: '2026-07-28T10:00:00.000Z',
    deleted_at: null,
    deleted_by: null,
    ...overrides,
});

const normalize = (row) => normalizeChatMessageRow(row, ids.sender);

test('a text INSERT keeps the existing fast path', () => {
    const action = resolveRealtimeMessageAction(textRow(), ids.conversation, normalize);
    assert.equal(action.type, 'deliver');
    assert.equal(action.message.id, ids.message);
    assert.equal(action.message.messageKind, 'text');
});

test('an image INSERT without the attachment join triggers a targeted reconcile', () => {
    // Realtime payloads never carry the embedded attachment join, so the image
    // row cannot be normalized and must be reconciled by id.
    const action = resolveRealtimeMessageAction(
        textRow({ message_kind: 'image', body: null }),
        ids.conversation,
        normalize,
    );
    assert.equal(action.type, 'reconcile');
    assert.equal(action.messageId, ids.message);
});

test('a payload for a different conversation is ignored entirely', () => {
    const action = resolveRealtimeMessageAction(textRow({ conversation_id: ids.other }), ids.conversation, normalize);
    assert.equal(action.type, 'ignore');
});

test('a legacy/malformed row without a usable id is ignored, not reconciled', () => {
    const action = resolveRealtimeMessageAction(
        { conversation_id: ids.conversation, id: 'not-a-uuid' },
        ids.conversation,
        normalize,
    );
    assert.equal(action.type, 'ignore');
});

test('an image tombstone normalizes on the fast path (no reconcile needed)', () => {
    const action = resolveRealtimeMessageAction(
        textRow({ message_kind: 'image', body: null, deleted_at: '2026-07-28T11:00:00.000Z', deleted_by: ids.sender }),
        ids.conversation,
        normalize,
    );
    assert.equal(action.type, 'deliver');
    assert.equal(action.message.isDeleted, true);
    assert.equal(action.message.attachment, null);
});

test('a reconciled image row read with its join carries the dedupe ids', () => {
    // Simulates fetchChatMessageById's normalization of a joined row.
    const joined = textRow({
        message_kind: 'image',
        body: null,
        attachment: {
            id: ids.attachment,
            message_id: ids.message,
            bucket_id: 'chat-images',
            object_path: objectPath,
            mime_type: 'image/jpeg',
            byte_size: 128000,
            width: 2048,
            height: 1536,
            deleted_at: null,
        },
    });
    const message = normalizeChatMessageRow(joined, ids.sender);
    assert.equal(message.messageKind, 'image');
    assert.equal(message.clientMessageId, ids.clientMessage);
    assert.equal(message.attachment.objectPath, objectPath);
});

test('an invalid conversation id makes every payload a no-op', () => {
    assert.equal(resolveRealtimeMessageAction(textRow(), 'not-a-uuid', normalize).type, 'ignore');
});
