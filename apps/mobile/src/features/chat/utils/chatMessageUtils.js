'use strict';

// Pure, framework-free canonical chat helpers for the mobile client.
// Written in CommonJS so Node's built-in test runner can exercise them without
// extra tooling; Metro/Babel consumes them unchanged inside the app bundle.
//
// Column names follow the canonical migration chain (chat_conversations,
// chat_messages, chat_read_states). Legacy chat_messages rows
// (conversation_id IS NULL) are always rejected here; message_text is never
// used as a fallback for the canonical body column.

const { CHAT_MESSAGE_MAX_LENGTH } = require('../constants/chatConstants');
const {
    CHAT_IMAGE_BUCKET_ID,
    CHAT_IMAGE_MAX_BYTES,
    CHAT_IMAGE_MAX_EDGE_PIXELS,
    CHAT_IMAGE_MAX_TOTAL_PIXELS,
    CHAT_IMAGE_MIME_TYPE,
    CHAT_IMAGE_OBJECT_PATH_PATTERN,
    isChatMessageKind,
} = require('../constants/chatImageConstants');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CHAT_BODY_INVALID_MESSAGE = 'Mesaj metni geçersiz.';
const CHAT_BODY_EMPTY_MESSAGE = 'Mesaj metni boş olamaz.';
const CHAT_BODY_TOO_LONG_MESSAGE = `Mesaj en fazla ${CHAT_MESSAGE_MAX_LENGTH} karakter olabilir.`;

const isValidUuid = (value) => typeof value === 'string' && UUID_PATTERN.test(value);

const normalizeIsoTimestamp = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;
    const time = Date.parse(value);
    return Number.isNaN(time) ? null : new Date(time).toISOString();
};

const firstAttachmentRecord = (value) => {
    const candidate = Array.isArray(value) ? value[0] : value;
    return candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : null;
};

const isPositiveBoundedInteger = (value, maximum) => (
    typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= maximum
);

// Resolves `message_kind`. A missing value stays backward compatible with rows
// written before the image schema; any unknown value is rejected (returns null).
const resolveMessageKind = (value) => {
    if (value === undefined || value === null) return 'text';
    return isChatMessageKind(value) ? value : null;
};

// Fail-closed normalization of embedded `chat_attachments` metadata against the
// canonical JPEG-only contract. Returns null when the payload is missing/empty
// or violates the contract so a malformed row can never render as a real image.
const normalizeChatImageAttachment = (value, expectedMessageId) => {
    const row = firstAttachmentRecord(value);
    if (!row) return null;

    const id = typeof row.id === 'string' ? row.id : null;
    const messageId = typeof row.message_id === 'string' ? row.message_id : null;
    const bucketId = typeof row.bucket_id === 'string' ? row.bucket_id : null;
    const objectPath = typeof row.object_path === 'string' ? row.object_path : null;
    const mimeType = typeof row.mime_type === 'string' ? row.mime_type : null;
    const byteSize = row.byte_size;
    const width = row.width;
    const height = row.height;
    const deletedAt = normalizeIsoTimestamp(row.deleted_at);

    if (
        !isValidUuid(id)
        || !isValidUuid(messageId)
        || messageId !== expectedMessageId
        || bucketId !== CHAT_IMAGE_BUCKET_ID
        || !objectPath
        || !CHAT_IMAGE_OBJECT_PATH_PATTERN.test(objectPath)
        || mimeType !== CHAT_IMAGE_MIME_TYPE
        || !isPositiveBoundedInteger(byteSize, CHAT_IMAGE_MAX_BYTES)
        || !isPositiveBoundedInteger(width, CHAT_IMAGE_MAX_EDGE_PIXELS)
        || !isPositiveBoundedInteger(height, CHAT_IMAGE_MAX_EDGE_PIXELS)
        || width * height > CHAT_IMAGE_MAX_TOTAL_PIXELS
    ) {
        return null;
    }

    return { id, messageId, bucketId, objectPath, mimeType, byteSize, width, height, deletedAt };
};

// Validates and trims an outgoing message body. Throws a plain Error with a
// safe Turkish message; the service boundary wraps it in ChatServiceError.
// Never truncates: over-limit input is rejected outright. Newlines are kept.
const normalizeChatBody = (value) => {
    if (typeof value !== 'string') {
        throw new Error(CHAT_BODY_INVALID_MESSAGE);
    }

    const body = value.trim();
    if (!body) {
        throw new Error(CHAT_BODY_EMPTY_MESSAGE);
    }
    if (Array.from(body).length > CHAT_MESSAGE_MAX_LENGTH) {
        throw new Error(CHAT_BODY_TOO_LONG_MESSAGE);
    }

    return body;
};

// Maps a raw chat_conversations row to the mobile domain model.
// Returns null when required UUIDs are invalid or the last-message pair
// violates the (both null / both set) contract.
const normalizeChatConversationRow = (row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;

    const id = row.id;
    const relationId = row.dietitian_client_id;
    const dietitianId = row.dietitian_id;
    const clientId = row.client_id;
    const lastMessageId = typeof row.last_message_id === 'string' ? row.last_message_id : null;
    const lastMessageAt = normalizeIsoTimestamp(row.last_message_at);
    const createdAt = normalizeIsoTimestamp(row.created_at);
    const updatedAt = normalizeIsoTimestamp(row.updated_at);

    if (!isValidUuid(id) || !isValidUuid(relationId) || !isValidUuid(dietitianId) || !isValidUuid(clientId)) {
        return null;
    }
    if (lastMessageId !== null && !isValidUuid(lastMessageId)) return null;
    // The schema keeps last_message_id and last_message_at paired.
    if ((lastMessageId === null) !== (lastMessageAt === null)) return null;
    if (!createdAt || !updatedAt) return null;

    return {
        id,
        relationId,
        dietitianId,
        clientId,
        lastMessageId,
        lastMessageAt,
        createdAt,
        updatedAt,
    };
};

// Maps a raw chat_messages row to the canonical mobile model.
// Returns null for legacy rows (conversation_id IS NULL), non-string or empty
// text bodies, unknown message kinds, and any row with invalid identifiers, so
// a single broken row can be discarded without dropping the whole history page.
// Extends the model with `messageKind` ('text' | 'image') and a fail-closed
// `attachment` while preserving the existing text-message contract.
const normalizeChatMessageRow = (row, currentUserId) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;

    const id = row.id;
    const conversationId = row.conversation_id;
    const senderId = row.sender_id;
    const rawClientMessageId = row.client_message_id;
    const body = row.body;
    const createdAt = normalizeIsoTimestamp(row.created_at);
    const deletedAt = normalizeIsoTimestamp(row.deleted_at);
    const rawDeletedBy = row.deleted_by;
    const messageKind = resolveMessageKind(row.message_kind);

    if (!isValidUuid(id) || !isValidUuid(conversationId) || !isValidUuid(senderId)) return null;

    // Canonical rows always carry a client id. Nullable values belong only to
    // legacy rows, which never enter the mobile chat timeline.
    if (!isValidUuid(rawClientMessageId)) return null;
    if (messageKind === null) return null;
    if (!createdAt) return null;

    const isDeleted = row.deleted_at !== null && row.deleted_at !== undefined;

    // Tombstones keep the existing deleted-message contract for both kinds: no
    // body, no readable attachment, and a recorded deleter equal to the sender.
    if (isDeleted) {
        if (!deletedAt || !isValidUuid(rawDeletedBy) || rawDeletedBy !== senderId || body !== null) return null;
        return {
            id,
            conversationId,
            senderId,
            clientMessageId: rawClientMessageId,
            body: null,
            createdAt,
            deletedAt,
            deletedBy: rawDeletedBy,
            isDeleted: true,
            isOwn: senderId === currentUserId,
            deliveryState: 'sent',
            messageKind,
            attachment: null,
        };
    }

    if (rawDeletedBy !== null && rawDeletedBy !== undefined) return null;

    const trimmedBody = typeof body === 'string' ? body.trim() : null;
    if (trimmedBody !== null && Array.from(trimmedBody).length > CHAT_MESSAGE_MAX_LENGTH) return null;

    const rawAttachment = row.attachment;
    const hasAttachmentPayload = Array.isArray(rawAttachment)
        ? rawAttachment.length > 0
        : rawAttachment !== undefined && rawAttachment !== null;
    const attachment = rawAttachment === undefined || rawAttachment === null
        ? null
        : normalizeChatImageAttachment(rawAttachment, id);

    let resolvedBody;
    if (messageKind === 'image') {
        // Live image rows require complete, live attachment metadata. The
        // caption is optional and an empty caption normalizes to null.
        if (!attachment || attachment.deletedAt !== null) return null;
        resolvedBody = trimmedBody ? trimmedBody : null;
    } else {
        // Live text rows keep the mandatory body contract and must not carry a
        // live attachment. A non-null but malformed attachment invalidates the row.
        if (typeof body !== 'string' || !trimmedBody) return null;
        if (hasAttachmentPayload && !attachment) return null;
        if (attachment && attachment.deletedAt === null) return null;
        resolvedBody = body;
    }

    return {
        id,
        conversationId,
        senderId,
        clientMessageId: rawClientMessageId,
        body: resolvedBody,
        createdAt,
        deletedAt: null,
        deletedBy: null,
        isDeleted: false,
        isOwn: senderId === currentUserId,
        deliveryState: 'sent',
        messageKind,
        attachment: messageKind === 'image' ? attachment : null,
    };
};

// Maps a raw chat_read_states row to the mobile domain model.
const normalizeChatReadStateRow = (row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return null;

    const conversationId = row.conversation_id;
    const userId = row.user_id;
    const lastDeliveredMessageId = typeof row.last_delivered_message_id === 'string'
        ? row.last_delivered_message_id
        : null;
    const lastReadMessageId = typeof row.last_read_message_id === 'string' ? row.last_read_message_id : null;
    const rawLastDeliveredAt = row.last_delivered_at;
    const rawLastReadAt = row.last_read_at;
    const lastDeliveredAt = normalizeIsoTimestamp(rawLastDeliveredAt);
    const lastReadAt = normalizeIsoTimestamp(rawLastReadAt);

    if (!isValidUuid(conversationId) || !isValidUuid(userId)) return null;
    if (lastDeliveredMessageId !== null && !isValidUuid(lastDeliveredMessageId)) return null;
    if (lastReadMessageId !== null && !isValidUuid(lastReadMessageId)) return null;
    if (rawLastDeliveredAt !== null && rawLastDeliveredAt !== undefined && lastDeliveredAt === null) return null;
    if (rawLastReadAt !== null && rawLastReadAt !== undefined && lastReadAt === null) return null;
    if ((lastDeliveredMessageId === null) !== (lastDeliveredAt === null)) return null;
    if ((lastReadMessageId === null) !== (lastReadAt === null)) return null;

    return {
        conversationId,
        userId,
        lastDeliveredMessageId,
        lastDeliveredAt,
        lastReadMessageId,
        lastReadAt,
        updatedAt: normalizeIsoTimestamp(row.updated_at),
    };
};

// Minimal structural check for canonical (and future optimistic) message
// models: a server UUID, a valid content shape for the message kind, and a
// clientMessageId that is a non-empty string. A live text message needs a
// non-empty body; a live image message needs a live attachment (its caption
// may be null). Tombstones keep the deleted-message shape for both kinds.
const isCanonicalChatMessage = (candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    if (!isValidUuid(candidate.id) || !isValidUuid(candidate.conversationId)
        || !isValidUuid(candidate.senderId) || !isValidUuid(candidate.clientMessageId)) {
        return false;
    }
    if (normalizeIsoTimestamp(candidate.createdAt) === null) return false;
    if (candidate.deliveryState !== 'sent') return false;

    if (candidate.isDeleted === true) {
        return candidate.body === null
            && normalizeIsoTimestamp(candidate.deletedAt) !== null
            && candidate.deletedBy === candidate.senderId;
    }

    if (candidate.messageKind === 'image') {
        return Boolean(candidate.attachment)
            && (candidate.body === null || (typeof candidate.body === 'string' && Boolean(candidate.body.trim())));
    }

    return typeof candidate.body === 'string' && Boolean(candidate.body.trim());
};

const compareChatMessages = (left, right) => {
    const timeDifference = (Date.parse(left.createdAt) || 0) - (Date.parse(right.createdAt) || 0);
    if (timeDifference !== 0) return timeDifference;
    if (left.id < right.id) return -1;
    if (left.id > right.id) return 1;
    return 0;
};

// Merges two message lists into a deduplicated, chronologically ordered list.
// Dedupe keys: server id always; clientMessageId only when non-empty (null
// client ids never match each other). For a clientMessageId collision the
// later (canonical server) copy wins. Inputs are never mutated.
const mergeCanonicalChatMessages = (existingMessages, incomingMessages) => {
    const byId = new Map();
    const idByClientMessageId = new Map();

    const push = (candidate) => {
        if (!isCanonicalChatMessage(candidate)) return;

        const clientKey = typeof candidate.clientMessageId === 'string' && candidate.clientMessageId
            ? candidate.clientMessageId
            : null;

        if (byId.has(candidate.id)) {
            byId.set(candidate.id, candidate);
            if (clientKey) idByClientMessageId.set(clientKey, candidate.id);
            return;
        }

        if (clientKey && idByClientMessageId.has(clientKey)) {
            byId.delete(idByClientMessageId.get(clientKey));
        }

        byId.set(candidate.id, candidate);
        if (clientKey) idByClientMessageId.set(clientKey, candidate.id);
    };

    const existing = Array.isArray(existingMessages) ? existingMessages : [];
    const incoming = Array.isArray(incomingMessages) ? incomingMessages : [];
    existing.forEach(push);
    incoming.forEach(push);

    return [...byId.values()].sort(compareChatMessages);
};

// Cursor shape for keyset pagination: { createdAt, id }.
const isValidChatCursor = (cursor) => Boolean(cursor)
    && typeof cursor === 'object'
    && normalizeIsoTimestamp(cursor.createdAt) !== null
    && isValidUuid(cursor.id);

module.exports = {
    isValidUuid,
    normalizeIsoTimestamp,
    normalizeChatBody,
    normalizeChatConversationRow,
    normalizeChatMessageRow,
    normalizeChatReadStateRow,
    mergeCanonicalChatMessages,
    isCanonicalChatMessage,
    isValidChatCursor,
    resolveMessageKind,
    normalizeChatImageAttachment,
};
