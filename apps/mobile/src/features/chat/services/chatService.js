import { supabase } from '../../../lib/supabaseClient';
import {
    CHAT_MESSAGE_MAX_PAGE_SIZE,
    CHAT_MESSAGE_PAGE_SIZE,
} from '../constants/chatConstants';
import {
    isValidChatCursor,
    isValidUuid,
    normalizeChatBody,
    normalizeChatConversationRow,
    normalizeChatMessageRow,
    normalizeChatReadStateRow,
} from '../utils/chatMessageUtils';

// Mobile canonical chat service layer.
//
// Contract (production, verified via the web migration chain):
// - Authenticated users only SELECT chat_conversations / chat_messages /
//   chat_read_states. All writes go through SECURITY DEFINER RPCs.
// - send_chat_message(p_dietitian_client_id, p_client_message_id, p_body)
//   lazily creates the canonical conversation on the first message and is
//   idempotent per (sender_id, client_message_id).
// - mark_chat_conversation_read(p_conversation_id, p_last_read_message_id)
//   moves the caller's own read cursor monotonically forward.
// This module never performs direct DML on chat tables, never generates
// client message UUIDs (the caller owns idempotency keys), and never logs
// message bodies or session data.

export const CHAT_ERROR_CODES = Object.freeze({
    INVALID_INPUT: 'INVALID_INPUT',
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    NETWORK: 'NETWORK',
    DATABASE: 'DATABASE',
    UNKNOWN: 'UNKNOWN',
});

// Safe error type for the chat feature. `userMessage` is a plain Turkish
// string suitable for UI display. `cause` carries the original error for
// development/debugging only; raw Supabase errors must not reach the UI.
export class ChatServiceError extends Error {
    constructor(code, userMessage, cause) {
        super(userMessage);
        this.name = 'ChatServiceError';
        this.code = code;
        this.userMessage = userMessage;
        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

const GENERIC_ERROR_MESSAGE = 'Sohbet işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin.';

// Maps raw Supabase/PostgREST errors to safe categories. Only error codes and
// status numbers are inspected; raw messages and statements are never
// propagated to the UI-facing message.
const toChatServiceError = (error) => {
    if (error instanceof ChatServiceError) return error;

    const databaseCode = error && typeof error === 'object' ? error.code : undefined;
    const status = error && typeof error === 'object' ? error.status : undefined;
    const rawMessage = error && typeof error.message === 'string' ? error.message.toLowerCase() : '';

    let code = CHAT_ERROR_CODES.UNKNOWN;
    let userMessage = GENERIC_ERROR_MESSAGE;

    if (status === 401) {
        code = CHAT_ERROR_CODES.UNAUTHENTICATED;
        userMessage = 'Oturumunuz doğrulanamadı. Lütfen yeniden giriş yapın.';
    } else if (status === 403 || databaseCode === '42501') {
        code = CHAT_ERROR_CODES.FORBIDDEN;
        userMessage = 'Bu sohbet işlemine erişim izniniz yok.';
    } else if (status === 404 || databaseCode === 'PGRST116') {
        code = CHAT_ERROR_CODES.NOT_FOUND;
        userMessage = 'İstenen sohbet kaydı bulunamadı.';
    } else if (status === 409 || databaseCode === '23505') {
        code = CHAT_ERROR_CODES.CONFLICT;
        userMessage = 'Sohbet işlemi mevcut kayıtla çakıştı. Lütfen tekrar deneyin.';
    } else if (databaseCode === '22023' || databaseCode === '23514' || databaseCode === '22P02') {
        code = CHAT_ERROR_CODES.INVALID_INPUT;
        userMessage = 'Sohbet bilgisi geçersiz. Lütfen bilgileri kontrol edip tekrar deneyin.';
    } else if (rawMessage.includes('network') || rawMessage.includes('failed to fetch')) {
        code = CHAT_ERROR_CODES.NETWORK;
        userMessage = 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
    } else if (
        (typeof databaseCode === 'string'
            && (databaseCode.startsWith('2') || databaseCode.startsWith('PGRST')))
        || (typeof status === 'number' && status >= 500)
    ) {
        code = CHAT_ERROR_CODES.DATABASE;
        userMessage = 'Sohbet veritabanında bir sorun oluştu. Lütfen tekrar deneyin.';
    }

    return new ChatServiceError(code, userMessage, error);
};

const createInvalidInputError = (field) => new ChatServiceError(
    CHAT_ERROR_CODES.INVALID_INPUT,
    'Sohbet bilgisi geçersiz. Lütfen bilgileri kontrol edip tekrar deneyin.',
    new Error(`Invalid chat field: ${field}`),
);

// Service-boundary UUID guard: no Supabase query or RPC is ever built from an
// unvalidated identifier.
const assertUuid = (value, field) => {
    if (!isValidUuid(value)) throw createInvalidInputError(field);
    return value;
};

const assertOptionalUuid = (value, field) => {
    if (value === undefined || value === null) return null;
    return assertUuid(value, field);
};

const assertChatBody = (value) => {
    try {
        return normalizeChatBody(value);
    } catch (error) {
        // normalizeChatBody throws with a safe Turkish message and never
        // includes the body content itself.
        throw new ChatServiceError(CHAT_ERROR_CODES.INVALID_INPUT, error.message, error);
    }
};

const throwUnexpectedPayload = (resource) => {
    throw new ChatServiceError(
        CHAT_ERROR_CODES.UNKNOWN,
        'Sohbet işlemi beklenmeyen bir yanıt döndürdü. Lütfen tekrar deneyin.',
        new Error(`Unexpected ${resource} payload`),
    );
};

const CHAT_MESSAGE_COLUMNS = [
    'id',
    'conversation_id',
    'sender_id',
    'client_message_id',
    'body',
    'message_kind',
    'created_at',
    'deleted_at',
    'deleted_by',
    // Embedded to-one join: chat_attachments.message_id is unique in the image
    // schema. Realtime postgres_changes payloads cannot carry this join, so
    // image rows arriving over Realtime are reconciled with a targeted refetch.
    'attachment:chat_attachments(id, message_id, bucket_id, object_path, mime_type, byte_size, width, height, deleted_at)',
].join(', ');
const CHAT_READ_STATE_COLUMNS = 'conversation_id, user_id, last_delivered_message_id, last_delivered_at, last_read_message_id, last_read_at, updated_at';

// Reads the canonical conversation for the caller's active relationship.
// Returns null when the relationship has no conversation yet (first message
// flow); throws CONFLICT when the unique-per-relation contract is violated.
export const getChatConversationByRelationId = async ({ relationId } = {}) => {
    const normalizedRelationId = assertUuid(relationId, 'relationId');

    try {
        const { data, error } = await supabase
            .from('chat_conversations')
            .select('id, dietitian_client_id, dietitian_id, client_id, last_message_id, last_message_at, created_at, updated_at')
            .eq('dietitian_client_id', normalizedRelationId)
            .limit(2);

        if (error) throw toChatServiceError(error);

        const rows = Array.isArray(data) ? data : [];
        if (rows.length === 0) return null;
        if (rows.length > 1) {
            throw new ChatServiceError(
                CHAT_ERROR_CODES.CONFLICT,
                'Sohbet kaydı tutarsız görünüyor. Lütfen daha sonra tekrar deneyin.',
                new Error('Multiple chat conversations for one relation'),
            );
        }

        const conversation = normalizeChatConversationRow(rows[0]);
        if (!conversation) throwUnexpectedPayload('chat conversation');
        return conversation;
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Keyset-paginated canonical message history.
//
// - Only canonical rows: conversation_id = conversationId (which also excludes
//   legacy conversation_id IS NULL rows).
// - Keyset on (created_at, id); no offset pagination.
// - DB reads the newest page descending; the return value is flipped to
//   createdAt ASC, id ASC display order.
// - nextCursor derives from the oldest returned message and is null on the
//   last page. Cursor values are validated before entering the query string.
// - Invalid or legacy rows are discarded individually; one broken row never
//   drops the whole page.
export const fetchChatMessagesPage = async ({
    conversationId,
    currentUserId,
    cursor,
    pageSize,
} = {}) => {
    const normalizedConversationId = assertUuid(conversationId, 'conversationId');
    const normalizedCurrentUserId = assertUuid(currentUserId, 'currentUserId');

    const size = pageSize === undefined || pageSize === null ? CHAT_MESSAGE_PAGE_SIZE : pageSize;
    if (!Number.isInteger(size) || size < 1 || size > CHAT_MESSAGE_MAX_PAGE_SIZE) {
        throw createInvalidInputError('pageSize');
    }

    let normalizedCursor = null;
    if (cursor !== undefined && cursor !== null) {
        if (!isValidChatCursor(cursor)) throw createInvalidInputError('cursor');
        normalizedCursor = {
            createdAt: new Date(cursor.createdAt).toISOString(),
            id: cursor.id,
        };
    }

    try {
        let query = supabase
            .from('chat_messages')
            .select(CHAT_MESSAGE_COLUMNS)
            .eq('conversation_id', normalizedConversationId)
            .not('conversation_id', 'is', null);

        if (normalizedCursor) {
            query = query.or(
                `created_at.lt.${normalizedCursor.createdAt},and(created_at.eq.${normalizedCursor.createdAt},id.lt.${normalizedCursor.id})`,
            );
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(size + 1);

        if (error) throw toChatServiceError(error);

        const seenIds = new Set();
        const seenClientMessageIds = new Set();
        const messagesDescending = [];
        const rows = Array.isArray(data) ? data : [];

        for (const row of rows) {
            const message = normalizeChatMessageRow(row, normalizedCurrentUserId);
            if (!message) continue;
            if (seenIds.has(message.id)) continue;
            if (message.clientMessageId && seenClientMessageIds.has(message.clientMessageId)) continue;
            seenIds.add(message.id);
            if (message.clientMessageId) seenClientMessageIds.add(message.clientMessageId);
            messagesDescending.push(message);
        }

        const hasMore = messagesDescending.length > size;
        const pageMessages = hasMore ? messagesDescending.slice(0, size) : messagesDescending;
        const oldestMessage = pageMessages[pageMessages.length - 1] || null;

        return {
            messages: [...pageMessages].reverse(),
            nextCursor: hasMore && oldestMessage
                ? { createdAt: oldestMessage.createdAt, id: oldestMessage.id }
                : null,
        };
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Re-reads a single canonical message with its attachment join.
//
// Realtime postgres_changes payloads carry only the chat_messages row, so an
// image INSERT arrives without the embedded chat_attachments metadata and
// cannot be normalized fail-closed. This targeted read resolves the canonical
// row without waiting for a reconnect-driven full refetch.
//
// `null` means "not readable yet": the caller must not synthesize a partial
// message from the Realtime payload.
export const fetchChatMessageById = async ({
    messageId,
    conversationId,
    currentUserId,
} = {}) => {
    const normalizedMessageId = assertUuid(messageId, 'messageId');
    const normalizedConversationId = assertUuid(conversationId, 'conversationId');
    const normalizedCurrentUserId = assertUuid(currentUserId, 'currentUserId');

    try {
        const { data, error } = await supabase
            .from('chat_messages')
            .select(CHAT_MESSAGE_COLUMNS)
            .eq('id', normalizedMessageId)
            .eq('conversation_id', normalizedConversationId)
            .not('conversation_id', 'is', null)
            .limit(1);

        if (error) throw toChatServiceError(error);

        const row = Array.isArray(data) ? data[0] : null;
        if (!row) return null;

        const message = normalizeChatMessageRow(row, normalizedCurrentUserId);
        if (!message || message.id !== normalizedMessageId
            || message.conversationId !== normalizedConversationId) {
            return null;
        }
        return message;
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Sends a message through the canonical RPC only. The RPC receives exactly the
// relationship id, the caller-owned idempotency key, and the trimmed body —
// never sender/client/dietitian/conversation identifiers. Retry is safe:
// calling again with the same clientMessageId returns the original row.
export const sendChatMessage = async ({
    relationId,
    clientMessageId,
    body,
    currentUserId,
} = {}) => {
    const normalizedRelationId = assertUuid(relationId, 'relationId');
    const normalizedClientMessageId = assertUuid(clientMessageId, 'clientMessageId');
    const normalizedBody = assertChatBody(body);
    const normalizedCurrentUserId = assertOptionalUuid(currentUserId, 'currentUserId');

    try {
        const { data, error } = await supabase.rpc('send_chat_message', {
            p_dietitian_client_id: normalizedRelationId,
            p_client_message_id: normalizedClientMessageId,
            p_body: normalizedBody,
        });

        if (error) throw toChatServiceError(error);

        // The RPC returns the inserted (or idempotent-replayed) canonical
        // chat_messages row; its conversation_id lets the caller re-fetch the
        // lazily created conversation by relation afterwards.
        const senderId = data && typeof data === 'object' ? data.sender_id : null;
        const message = normalizeChatMessageRow(data, normalizedCurrentUserId || senderId || '');
        if (!message || message.clientMessageId !== normalizedClientMessageId) {
            throwUnexpectedPayload('send_chat_message');
        }

        return message;
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Loads both participant receipt rows through SELECT-only table access. Raw
// PostgREST rows never escape this boundary.
export const fetchChatReadStates = async ({ conversationId } = {}) => {
    const normalizedConversationId = assertUuid(conversationId, 'conversationId');

    try {
        const { data, error } = await supabase
            .from('chat_read_states')
            .select(CHAT_READ_STATE_COLUMNS)
            .eq('conversation_id', normalizedConversationId)
            .limit(3);

        if (error) throw toChatServiceError(error);

        const byUserId = new Map();
        for (const row of Array.isArray(data) ? data : []) {
            const readState = normalizeChatReadStateRow(row);
            if (!readState || readState.conversationId !== normalizedConversationId) continue;
            byUserId.set(readState.userId, readState);
        }
        if (byUserId.size > 2) throwUnexpectedPayload('chat read states');
        return [...byUserId.values()];
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Soft-deletes only the authenticated sender's canonical message through the
// idempotent backend RPC. Optimistic/failed messages never reach this service
// because they have no canonical UUID.
export const deleteChatMessage = async ({ messageId } = {}) => {
    const normalizedMessageId = assertUuid(messageId, 'messageId');

    try {
        const { data, error } = await supabase.rpc('delete_chat_message', {
            p_message_id: normalizedMessageId,
        });
        if (error) throw toChatServiceError(error);

        const senderId = data && typeof data === 'object' ? data.sender_id : null;
        const message = normalizeChatMessageRow(data, senderId || '');
        if (!message || message.id !== normalizedMessageId || message.isDeleted !== true || message.isOwn !== true) {
            throwUnexpectedPayload('delete_chat_message');
        }
        return message;
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Advances the caller's delivery cursor through the canonical monotonic RPC.
export const markChatConversationDelivered = async ({
    conversationId,
    lastDeliveredMessageId,
} = {}) => {
    const normalizedConversationId = assertUuid(conversationId, 'conversationId');
    const normalizedLastDeliveredMessageId = assertUuid(lastDeliveredMessageId, 'lastDeliveredMessageId');

    try {
        const { data, error } = await supabase.rpc('mark_chat_conversation_delivered', {
            p_conversation_id: normalizedConversationId,
            p_last_delivered_message_id: normalizedLastDeliveredMessageId,
        });
        if (error) throw toChatServiceError(error);

        const readState = normalizeChatReadStateRow(data);
        if (!readState || readState.conversationId !== normalizedConversationId
            || !readState.lastDeliveredMessageId || !readState.lastDeliveredAt) {
            throwUnexpectedPayload('mark_chat_conversation_delivered');
        }
        return readState;
    } catch (error) {
        throw toChatServiceError(error);
    }
};

// Moves the caller's own read cursor through the canonical RPC only. The
// server keeps the cursor monotonic; a stale cursor resolves to the existing
// read state instead of moving backwards.
export const markChatConversationRead = async ({
    conversationId,
    lastReadMessageId,
} = {}) => {
    const normalizedConversationId = assertUuid(conversationId, 'conversationId');
    const normalizedLastReadMessageId = assertUuid(lastReadMessageId, 'lastReadMessageId');

    try {
        const { data, error } = await supabase.rpc('mark_chat_conversation_read', {
            p_conversation_id: normalizedConversationId,
            p_last_read_message_id: normalizedLastReadMessageId,
        });

        if (error) throw toChatServiceError(error);

        const readState = normalizeChatReadStateRow(data);
        if (!readState || readState.conversationId !== normalizedConversationId
            || !readState.lastReadMessageId || !readState.lastReadAt) {
            throwUnexpectedPayload('mark_chat_conversation_read');
        }

        return readState;
    } catch (error) {
        throw toChatServiceError(error);
    }
};
