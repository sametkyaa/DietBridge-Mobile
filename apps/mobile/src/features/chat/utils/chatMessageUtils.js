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
// bodies, and any row with invalid identifiers, so a single broken row can be
// discarded without dropping the whole history page.
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

    if (!isValidUuid(id) || !isValidUuid(conversationId) || !isValidUuid(senderId)) return null;

    // Canonical rows always carry a client id. Nullable values belong only to
    // legacy rows, which never enter the mobile chat timeline.
    if (!isValidUuid(rawClientMessageId)) return null;

    const isDeleted = row.deleted_at !== null && row.deleted_at !== undefined;
    let deletedBy = null;
    if (isDeleted) {
        if (!deletedAt || !isValidUuid(rawDeletedBy) || rawDeletedBy !== senderId || body !== null) return null;
        deletedBy = rawDeletedBy;
    } else {
        if (rawDeletedBy !== null && rawDeletedBy !== undefined) return null;
        if (typeof body !== 'string' || !body.trim()) return null;
        if (Array.from(body).length > CHAT_MESSAGE_MAX_LENGTH) return null;
    }
    if (!createdAt) return null;

    return {
        id,
        conversationId,
        senderId,
        clientMessageId: rawClientMessageId,
        body: isDeleted ? null : body,
        createdAt,
        deletedAt: isDeleted ? deletedAt : null,
        deletedBy,
        isDeleted,
        isOwn: senderId === currentUserId,
        deliveryState: 'sent',
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
// models: a server UUID, a non-empty string body, and a clientMessageId that
// is either null or a non-empty string.
const isCanonicalChatMessage = (candidate) => Boolean(candidate)
    && typeof candidate === 'object'
    && isValidUuid(candidate.id)
    && isValidUuid(candidate.conversationId)
    && isValidUuid(candidate.senderId)
    && isValidUuid(candidate.clientMessageId)
    && normalizeIsoTimestamp(candidate.createdAt) !== null
    && candidate.deliveryState === 'sent'
    && (
        (candidate.isDeleted === true && candidate.body === null
            && normalizeIsoTimestamp(candidate.deletedAt) !== null
            && candidate.deletedBy === candidate.senderId)
        || (candidate.isDeleted !== true && typeof candidate.body === 'string' && Boolean(candidate.body.trim()))
    );

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
};
