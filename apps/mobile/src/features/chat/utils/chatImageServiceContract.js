'use strict';

// Pure, framework-free contract logic for the chat image Supabase service.
//
// Everything here is deterministic and dependency-free so Node's test runner
// can exercise the fail-closed rules without a device or a Supabase client.
// The service module (`services/chatImageService.js`) imports these helpers and
// only performs the actual RPC/Storage I/O around them.

const { isValidUuid } = require('./chatMessageUtils');
const { ChatImageError, createChatImageError } = require('./chatImageError');
const {
    CHAT_IMAGE_BUCKET_ID,
    CHAT_IMAGE_CAPTION_MAX_LENGTH,
    CHAT_IMAGE_MAX_BYTES,
    CHAT_IMAGE_MIME_TYPE,
    CHAT_IMAGE_OBJECT_PATH_PATTERN,
} = require('../constants/chatImageConstants');

const asRecord = (value) => (
    value && typeof value === 'object' && !Array.isArray(value) ? value : null
);

const firstRecord = (value) => (Array.isArray(value) ? asRecord(value[0]) : asRecord(value));

const getString = (record, key) => {
    const value = record[key];
    return typeof value === 'string' ? value : null;
};

const getErrorText = (error) => {
    const record = asRecord(error);
    if (!record) return '';
    return [record.message, record.details, record.hint, record.error]
        .filter((part) => typeof part === 'string')
        .join(' ')
        .toLowerCase();
};

const getErrorCode = (error) => {
    const record = asRecord(error);
    const code = record ? record.code : undefined;
    return typeof code === 'string' ? code : null;
};

const getErrorStatus = (error) => {
    const record = asRecord(error);
    const status = record ? (record.status ?? record.statusCode) : undefined;
    if (typeof status === 'number') return status;
    if (typeof status === 'string' && /^\d+$/.test(status)) return Number(status);
    return null;
};

const RETRYABLE_CODES = new Set(['storage_upload_failed', 'network', 'unknown']);

// Maps a Supabase/PostgREST failure onto the narrow client error contract. The
// raw error is kept only as `cause`; it is never shown to the user.
const mapChatImageError = (error, fallback = 'unknown') => {
    if (error instanceof ChatImageError) return error;

    const code = getErrorCode(error);
    const status = getErrorStatus(error);
    const text = getErrorText(error);

    const resolve = () => {
        // Dormant grants: PostgREST reports either a missing function in the
        // schema cache or a plain execute-permission denial on the function.
        if (code === 'PGRST202' || text.includes('permission denied for function')) {
            return 'feature_unavailable';
        }
        if (code === '54000' || text.includes('quota exceeded')) return 'quota_exceeded';
        if (text.includes('unsupported chat image type')) return 'unsupported_type';
        if (text.includes('cannot be finalized') || text.includes('does not match validation')) {
            return 'validation_pending';
        }
        if (text.includes('expired')) return 'intent_expired';
        if (code === '42501' || status === 403) return 'access_denied';
        if (status === 401) return 'access_denied';
        if (code === '22023' || code === '23514' || code === '22P02') return 'invalid_request';
        if (status === 413 || text.includes('maximum allowed size')) return 'output_too_large';
        if (text.includes('network') || text.includes('failed to fetch')) return 'network';
        return fallback;
    };

    const resolved = resolve();
    return createChatImageError(resolved, {
        retryable: RETRYABLE_CODES.has(resolved),
        cause: error,
    });
};

const isFutureTimestamp = (value) => {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) && timestamp > Date.now();
};

// Fail-closed validation of the server-owned intent. A response that does not
// match the canonical contract is never used to build an upload target.
const normalizeUploadIntent = (value, expected) => {
    const row = firstRecord(value);
    if (!row) throw createChatImageError('invalid_response');

    const id = getString(row, 'id');
    const conversationId = getString(row, 'conversation_id');
    const createdBy = getString(row, 'created_by');
    const clientMessageId = getString(row, 'client_message_id');
    const bucketId = getString(row, 'bucket_id');
    const objectPath = getString(row, 'object_path');
    const expectedMime = getString(row, 'expected_mime');
    const maxBytes = row.max_bytes;
    const status = getString(row, 'status');
    const expiresAt = getString(row, 'expires_at');

    if (
        !isValidUuid(id)
        || !isValidUuid(conversationId)
        || conversationId !== expected.conversationId
        || !isValidUuid(createdBy)
        || !isValidUuid(clientMessageId)
        || clientMessageId !== expected.clientMessageId
        || bucketId !== CHAT_IMAGE_BUCKET_ID
        || !objectPath
        || !CHAT_IMAGE_OBJECT_PATH_PATTERN.test(objectPath)
        || expectedMime !== CHAT_IMAGE_MIME_TYPE
        || maxBytes !== CHAT_IMAGE_MAX_BYTES
        || status !== 'pending'
        || !expiresAt
    ) {
        throw createChatImageError('invalid_response');
    }

    if (!isFutureTimestamp(expiresAt)) throw createChatImageError('intent_expired');

    return {
        id,
        conversationId,
        createdBy,
        clientMessageId,
        bucketId,
        objectPath,
        expectedMime: CHAT_IMAGE_MIME_TYPE,
        maxBytes: CHAT_IMAGE_MAX_BYTES,
        status: 'pending',
        expiresAt,
    };
};

// Fail-closed guard evaluated before any Storage upload. A free-form path, a
// foreign bucket, an expired intent, a non-JPEG canonical or an out-of-budget
// byte size throws instead of reaching Storage.
const assertUploadTarget = (intent, canonical) => {
    if (
        !intent
        || intent.bucketId !== CHAT_IMAGE_BUCKET_ID
        || typeof intent.objectPath !== 'string'
        || !CHAT_IMAGE_OBJECT_PATH_PATTERN.test(intent.objectPath)
    ) {
        throw createChatImageError('invalid_response');
    }
    if (!isFutureTimestamp(intent.expiresAt)) throw createChatImageError('intent_expired');
    if (!canonical || canonical.mimeType !== CHAT_IMAGE_MIME_TYPE) {
        throw createChatImageError('unsupported_type');
    }
    const byteSize = canonical.byteSize;
    if (!Number.isSafeInteger(byteSize) || byteSize < 1 || byteSize > intent.maxBytes) {
        throw createChatImageError('output_too_large');
    }
};

// Trims a caption, normalizes an empty caption to null, and rejects captions
// longer than 4000 characters. The backend also enforces this bound.
const normalizeChatImageCaption = (caption) => {
    if (caption === null || caption === undefined) return null;
    if (typeof caption !== 'string') throw createChatImageError('invalid_request');

    const trimmed = caption.trim();
    if (!trimmed) return null;
    if (Array.from(trimmed).length > CHAT_IMAGE_CAPTION_MAX_LENGTH) {
        throw createChatImageError('invalid_request');
    }
    return trimmed;
};

// Fail-closed validation of a finalize RPC result row.
const normalizeFinalizeResult = (value) => {
    const row = firstRecord(value);
    if (!row) throw createChatImageError('invalid_response');

    const messageId = getString(row, 'id');
    const conversationId = getString(row, 'conversation_id');
    const senderId = getString(row, 'sender_id');
    const clientMessageId = getString(row, 'client_message_id');
    const messageKind = getString(row, 'message_kind');

    if (
        !isValidUuid(messageId)
        || !isValidUuid(conversationId)
        || !isValidUuid(senderId)
        || !isValidUuid(clientMessageId)
        || messageKind !== 'image'
    ) {
        throw createChatImageError('invalid_response');
    }

    return { messageId, conversationId, senderId, clientMessageId };
};

module.exports = {
    mapChatImageError,
    normalizeUploadIntent,
    assertUploadTarget,
    normalizeChatImageCaption,
    normalizeFinalizeResult,
};
