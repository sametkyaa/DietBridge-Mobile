'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    normalizeChatMessageRow,
    resolveMessageKind,
    normalizeChatImageAttachment,
    isCanonicalChatMessage,
} = require('../chatMessageUtils');
const {
    isChatImagesFeatureEnabledValue,
} = require('../chatImageFeatureFlag');

const ids = {
    conversation: '11111111-1111-4111-8111-111111111111',
    message: '22222222-2222-4222-8222-222222222222',
    sender: '33333333-3333-4333-8333-333333333333',
    clientMessage: '44444444-4444-4444-8444-444444444444',
    attachment: '55555555-5555-4555-8555-555555555555',
    intent: '66666666-6666-4666-8666-666666666666',
    object: '77777777-7777-4777-8777-777777777777',
};

const objectPath = `pending/${ids.intent}/${ids.object}.jpg`;

const attachmentRow = (overrides = {}) => ({
    id: ids.attachment,
    message_id: ids.message,
    bucket_id: 'chat-images',
    object_path: objectPath,
    mime_type: 'image/jpeg',
    byte_size: 128000,
    width: 2048,
    height: 2048,
    deleted_at: null,
    ...overrides,
});

const messageRow = (overrides = {}) => ({
    id: ids.message,
    conversation_id: ids.conversation,
    sender_id: ids.sender,
    client_message_id: ids.clientMessage,
    body: 'Merhaba',
    message_kind: 'text',
    created_at: '2026-07-28T10:00:00.000Z',
    deleted_at: null,
    deleted_by: null,
    attachment: null,
    ...overrides,
});

const imageRow = (overrides = {}) => messageRow({
    body: null,
    message_kind: 'image',
    attachment: attachmentRow(),
    ...overrides,
});

// --- Feature flag ---------------------------------------------------------

test('feature flag is off when the value is missing, empty or not exactly true', () => {
    for (const value of [undefined, null, '', 'false', 'FALSE', 'True', 'TRUE', '1', 'yes', ' true', 'true ', 1, true]) {
        assert.equal(isChatImagesFeatureEnabledValue(value), false, String(value));
    }
});

test('feature flag is on only for the exact string true', () => {
    assert.equal(isChatImagesFeatureEnabledValue('true'), true);
});

// --- resolveMessageKind ---------------------------------------------------

test('resolveMessageKind stays backward compatible and rejects unknown kinds', () => {
    assert.equal(resolveMessageKind(undefined), 'text');
    assert.equal(resolveMessageKind(null), 'text');
    assert.equal(resolveMessageKind('text'), 'text');
    assert.equal(resolveMessageKind('image'), 'image');
    for (const kind of ['video', 'file', '', 'TEXT', 7]) {
        assert.equal(resolveMessageKind(kind), null, String(kind));
    }
});

// --- Message normalization ------------------------------------------------

test('valid live text message normalizes and stays text-kind', () => {
    // The mobile read path preserves the raw text body (trimming happens on
    // send via normalizeChatBody); only the message kind and attachment are new.
    const message = normalizeChatMessageRow(messageRow({ body: '  Merhaba  ' }), ids.sender);
    assert.equal(message.body, '  Merhaba  ');
    assert.equal(message.messageKind, 'text');
    assert.equal(message.attachment, null);
    assert.equal(message.deliveryState, 'sent');
    assert.equal(message.isOwn, true);
});

test('missing message_kind stays backward compatible as text', () => {
    const row = messageRow();
    delete row.message_kind;
    const message = normalizeChatMessageRow(row, ids.sender);
    assert.equal(message.messageKind, 'text');
});

test('valid image message normalizes with attachment metadata', () => {
    const message = normalizeChatMessageRow(imageRow(), ids.sender);
    assert.equal(message.messageKind, 'image');
    assert.equal(message.body, null);
    assert.equal(message.attachment.objectPath, objectPath);
    assert.equal(message.attachment.mimeType, 'image/jpeg');
    assert.equal(message.attachment.byteSize, 128000);
    assert.equal(message.attachment.width, 2048);
    assert.equal(message.attachment.height, 2048);
    assert.equal(isCanonicalChatMessage(message), true);
});

test('image caption is trimmed and empty captions normalize to null', () => {
    const captioned = normalizeChatMessageRow(imageRow({ body: '  Ölçüm sonucu  ' }), ids.sender);
    assert.equal(captioned.body, 'Ölçüm sonucu');
    const blank = normalizeChatMessageRow(imageRow({ body: '   ' }), ids.sender);
    assert.equal(blank.body, null);
});

test('live text message without a usable body is rejected', () => {
    assert.equal(normalizeChatMessageRow(messageRow({ body: null }), ids.sender), null);
    assert.equal(normalizeChatMessageRow(messageRow({ body: '   ' }), ids.sender), null);
});

test('live text message must not carry a live attachment', () => {
    assert.equal(normalizeChatMessageRow(messageRow({ attachment: attachmentRow() }), ids.sender), null);
});

test('live text message with malformed attachment metadata is rejected', () => {
    assert.equal(normalizeChatMessageRow(messageRow({ attachment: attachmentRow({ mime_type: 'image/png' }) }), ids.sender), null);
    assert.equal(normalizeChatMessageRow(messageRow({ attachment: { bucket_id: 'avatars' } }), ids.sender), null);
    assert.equal(normalizeChatMessageRow(messageRow({ attachment: 'malformed-attachment' }), ids.sender), null);
});

test('image message without attachment metadata is rejected', () => {
    assert.equal(normalizeChatMessageRow(imageRow({ attachment: null }), ids.sender), null);
    assert.equal(normalizeChatMessageRow(imageRow({ attachment: undefined }), ids.sender), null);
});

test('image message with a soft-deleted attachment is rejected', () => {
    assert.equal(normalizeChatMessageRow(imageRow({ attachment: attachmentRow({ deleted_at: '2026-07-28T11:00:00.000Z' }) }), ids.sender), null);
});

test('attachment metadata outside the canonical JPEG contract is rejected', () => {
    const invalidAttachments = [
        { mime_type: 'image/png' },
        { mime_type: 'image/webp' },
        { bucket_id: 'avatars' },
        { object_path: `pending/${ids.intent}/${ids.object}.png` },
        { object_path: objectPath.replace('.jpg', '.JPG') },
        { object_path: objectPath.replace(ids.intent, 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA') },
        { object_path: objectPath.toUpperCase() },
        { object_path: `${ids.intent}/${ids.object}.jpg` },
        { object_path: `pending/${ids.intent}/../${ids.object}.jpg` },
        { byte_size: 0 },
        { byte_size: 4194305 },
        { byte_size: 1024.5 },
        { width: 2049 },
        { height: 2049 },
        { width: 4096, height: 2048 },
        { message_id: ids.conversation },
        { id: 'not-a-uuid' },
    ];
    for (const overrides of invalidAttachments) {
        assert.equal(
            normalizeChatMessageRow(imageRow({ attachment: attachmentRow(overrides) }), ids.sender),
            null,
            JSON.stringify(overrides),
        );
    }
});

test('uppercase UUID path and .JPG extension are rejected by the attachment normalizer', () => {
    assert.equal(normalizeChatImageAttachment(attachmentRow({ object_path: objectPath.toUpperCase() }), ids.message), null);
    assert.equal(normalizeChatImageAttachment(attachmentRow({ object_path: objectPath.replace('.jpg', '.JPG') }), ids.message), null);
    assert.ok(normalizeChatImageAttachment(attachmentRow(), ids.message));
});

test('missing byte size, width or height is rejected', () => {
    for (const overrides of [{ byte_size: null }, { width: null }, { height: null }, { byte_size: undefined }]) {
        assert.equal(normalizeChatImageAttachment(attachmentRow(overrides), ids.message), null, JSON.stringify(overrides));
    }
});

test('unknown message_kind values are rejected', () => {
    for (const kind of ['video', 'file', '', 'TEXT', 7]) {
        assert.equal(normalizeChatMessageRow(messageRow({ message_kind: kind }), ids.sender), null, String(kind));
    }
});

test('image tombstones keep the existing deleted-message contract', () => {
    const message = normalizeChatMessageRow(imageRow({
        body: null,
        deleted_at: '2026-07-28T11:00:00.000Z',
        deleted_by: ids.sender,
        attachment: attachmentRow({ deleted_at: '2026-07-28T11:00:00.000Z' }),
    }), ids.sender);
    assert.equal(message.messageKind, 'image');
    assert.equal(message.body, null);
    assert.equal(message.attachment, null);
    assert.equal(message.isDeleted, true);
    assert.equal(message.deletedBy, ids.sender);
    assert.equal(isCanonicalChatMessage(message), true);
});

test('malformed image message returns null instead of throwing', () => {
    assert.doesNotThrow(() => normalizeChatMessageRow(imageRow({ attachment: { nonsense: true } }), ids.sender));
    assert.equal(normalizeChatMessageRow(imageRow({ attachment: { nonsense: true } }), ids.sender), null);
});
