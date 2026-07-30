'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    mapChatImageError,
    normalizeUploadIntent,
    assertUploadTarget,
    normalizeChatImageCaption,
    normalizeFinalizeResult,
} = require('../chatImageServiceContract');

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

const intentRow = (overrides = {}) => ({
    id: ids.intent,
    conversation_id: ids.conversation,
    created_by: ids.sender,
    client_message_id: ids.clientMessage,
    bucket_id: 'chat-images',
    object_path: objectPath,
    expected_mime: 'image/jpeg',
    max_bytes: 4194304,
    status: 'pending',
    expires_at: new Date(Date.now() + 600000).toISOString(),
    ...overrides,
});

const uploadIntent = {
    id: ids.intent,
    conversationId: ids.conversation,
    createdBy: ids.sender,
    clientMessageId: ids.clientMessage,
    bucketId: 'chat-images',
    objectPath,
    expectedMime: 'image/jpeg',
    maxBytes: 4194304,
    status: 'pending',
    expiresAt: new Date(Date.now() + 600000).toISOString(),
};

const canonicalImage = (size = 200000) => ({
    uri: 'file:///tmp/out.jpg',
    body: new ArrayBuffer(0),
    byteSize: size,
    quality: 0.82,
    width: 2048,
    height: 1536,
    mimeType: 'image/jpeg',
});

const expected = { conversationId: ids.conversation, clientMessageId: ids.clientMessage };

test('the intent response is normalized to the exact server-owned target', () => {
    const intent = normalizeUploadIntent(intentRow(), expected);
    assert.equal(intent.bucketId, 'chat-images');
    assert.equal(intent.objectPath, objectPath);
    assert.equal(intent.status, 'pending');
    assert.equal(intent.maxBytes, 4194304);
    assert.equal(intent.expectedMime, 'image/jpeg');
});

test('an intent outside the canonical contract is rejected fail-closed', () => {
    const invalidRows = [
        { bucket_id: 'avatars' },
        { object_path: `pending/${ids.intent}/${ids.object}.png` },
        { object_path: `${ids.intent}/${ids.object}.jpg` },
        { object_path: `pending/${ids.intent}/../${ids.object}.jpg` },
        { object_path: objectPath.toUpperCase() },
        { expected_mime: 'image/png' },
        { max_bytes: 8388608 },
        { status: 'finalized' },
        { conversation_id: ids.message },
        { client_message_id: ids.attachment },
        { id: 'not-a-uuid' },
    ];
    for (const overrides of invalidRows) {
        assert.throws(
            () => normalizeUploadIntent(intentRow(overrides), expected),
            (error) => error.name === 'ChatImageError' && error.code === 'invalid_response',
            JSON.stringify(overrides),
        );
    }

    assert.throws(
        () => normalizeUploadIntent(intentRow({ expires_at: new Date(Date.now() - 1000).toISOString() }), expected),
        (error) => error.code === 'intent_expired',
    );
});

test('the upload target guard blocks free-form paths, foreign buckets and oversize blobs', () => {
    const rejected = [
        [{ objectPath: '../../etc/passwd' }, canonicalImage(), 'invalid_response'],
        [{ objectPath: 'public/anything.jpg' }, canonicalImage(), 'invalid_response'],
        [{ objectPath: objectPath.replace('.jpg', '.JPG') }, canonicalImage(), 'invalid_response'],
        [{ objectPath: objectPath.replace(ids.intent, 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA') }, canonicalImage(), 'invalid_response'],
        [{ bucketId: 'avatars' }, canonicalImage(), 'invalid_response'],
        [{ expiresAt: new Date(Date.now() - 1000).toISOString() }, canonicalImage(), 'intent_expired'],
        [{}, { ...canonicalImage(), mimeType: 'image/png' }, 'unsupported_type'],
        [{}, { ...canonicalImage(4194305), byteSize: 4194305 }, 'output_too_large'],
        [{}, { ...canonicalImage(0), byteSize: 0 }, 'output_too_large'],
    ];
    for (const [overrides, canonical, code] of rejected) {
        assert.throws(
            () => assertUploadTarget({ ...uploadIntent, ...overrides }, canonical),
            (error) => error.code === code,
            `${JSON.stringify(overrides)} -> ${code}`,
        );
    }
});

test('a valid upload target passes the guard', () => {
    assert.doesNotThrow(() => assertUploadTarget(uploadIntent, canonicalImage()));
});

test('captions are trimmed, emptied to null and capped at 4000 characters', () => {
    assert.equal(normalizeChatImageCaption('  Ölçüm  '), 'Ölçüm');
    assert.equal(normalizeChatImageCaption('   '), null);
    assert.equal(normalizeChatImageCaption(null), null);
    assert.equal(normalizeChatImageCaption(undefined), null);
    assert.equal(normalizeChatImageCaption('a'.repeat(4000)).length, 4000);
    assert.throws(
        () => normalizeChatImageCaption('a'.repeat(4001)),
        (error) => error.code === 'invalid_request',
    );
});

test('the finalize result is validated to a canonical image message', () => {
    const result = normalizeFinalizeResult({
        id: ids.message,
        conversation_id: ids.conversation,
        sender_id: ids.sender,
        client_message_id: ids.clientMessage,
        message_kind: 'image',
    });
    assert.deepEqual(result, {
        messageId: ids.message,
        conversationId: ids.conversation,
        senderId: ids.sender,
        clientMessageId: ids.clientMessage,
    });

    for (const overrides of [{ message_kind: 'text' }, { id: 'nope' }, { conversation_id: 'nope' }]) {
        assert.throws(
            () => normalizeFinalizeResult({
                id: ids.message,
                conversation_id: ids.conversation,
                sender_id: ids.sender,
                client_message_id: ids.clientMessage,
                message_kind: 'image',
                ...overrides,
            }),
            (error) => error.code === 'invalid_response',
        );
    }
});

test('a dormant grant error is surfaced as feature_unavailable and is not retryable', () => {
    const dormantErrors = [
        { code: 'PGRST202', message: 'Could not find the function public.create_chat_image_upload_intent' },
        { code: '42501', message: 'permission denied for function create_chat_image_upload_intent' },
    ];
    for (const error of dormantErrors) {
        const mapped = mapChatImageError(error, 'access_denied');
        assert.equal(mapped.code, 'feature_unavailable', JSON.stringify(error));
        assert.equal(mapped.retryable, false);
    }
});

test('error mapping distinguishes access, quota, expiry, validation and network', () => {
    assert.equal(mapChatImageError({ code: '42501', message: 'Chat access denied.' }, 'access_denied').code, 'access_denied');
    assert.equal(mapChatImageError({ code: '54000', message: 'quota exceeded' }).code, 'quota_exceeded');
    assert.equal(mapChatImageError({ message: 'Chat image intent cannot be finalized.' }, 'validation_pending').code, 'validation_pending');
    assert.equal(mapChatImageError({ message: 'intent has expired' }).code, 'intent_expired');
    assert.equal(mapChatImageError({ message: 'Network request failed' }).code, 'network');
    assert.equal(mapChatImageError({ message: 'Network request failed' }).retryable, true);
    assert.equal(mapChatImageError({ status: 413, message: 'exceeded the maximum allowed size' }).code, 'output_too_large');
});

test('raw Supabase error text never leaks into the user message', () => {
    const mapped = mapChatImageError({ code: 'PGRST999', message: 'relation chat_upload_intents does not exist' });
    assert.doesNotMatch(mapped.userMessage, /chat_upload_intents|PGRST|relation/);
    assert.match(mapped.userMessage, /Görsel/);
});
