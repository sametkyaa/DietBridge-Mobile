'use strict';

// Error and lifecycle contract for the canonical JPEG upload flow.
//
// Every failure surfaced to the UI is one of these categories, each with a
// Turkish user message and an explicit retryability decision. Raw
// Supabase/Postgres error objects never reach the UI; they are retained only
// as `cause` for development logging.

const CHAT_IMAGE_ERROR_MESSAGES = Object.freeze({
    unsupported_type: 'Yalnızca JPEG, PNG veya WebP görseller gönderilebilir.',
    decode_failed: 'Görsel okunamadı. Lütfen başka bir dosya deneyin.',
    invalid_dimensions: 'Görsel boyutları geçersiz. Lütfen başka bir dosya deneyin.',
    output_too_large: 'Görsel çok büyük. Lütfen daha küçük bir görsel seçin.',
    permission_denied: 'Görsellere erişim izni verilmedi. Lütfen izin verin ve tekrar deneyin.',
    invalid_request: 'Görsel bilgisi geçersiz. Lütfen tekrar deneyin.',
    access_denied: 'Bu sohbete görsel gönderme izniniz yok.',
    quota_exceeded: 'Çok fazla bekleyen görsel var. Lütfen biraz sonra tekrar deneyin.',
    intent_expired: 'Görsel gönderim süresi doldu. Lütfen görseli yeniden seçin.',
    validation_pending: 'Görsel doğrulaması tamamlanamadı. Lütfen daha sonra tekrar deneyin.',
    feature_unavailable: 'Görsel gönderme özelliği henüz kullanıma açık değil.',
    storage_upload_failed: 'Görsel yüklenemedi. Lütfen tekrar deneyin.',
    invalid_response: 'Görsel işlemi beklenmeyen bir yanıt döndürdü. Lütfen tekrar deneyin.',
    network: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.',
    aborted: 'Görsel gönderimi iptal edildi.',
    unknown: 'Görsel işlemi şu anda tamamlanamadı. Lütfen tekrar deneyin.',
});

// Safe error type for the chat image feature. `userMessage` is a plain Turkish
// string suitable for UI display. `cause` carries the original error for
// development/debugging only.
class ChatImageError extends Error {
    constructor(code, userMessage, retryable = false, cause) {
        super(userMessage);
        this.name = 'ChatImageError';
        this.code = code;
        this.userMessage = userMessage;
        this.retryable = retryable;
        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

const createChatImageError = (code, options = {}) => {
    const message = CHAT_IMAGE_ERROR_MESSAGES[code] || CHAT_IMAGE_ERROR_MESSAGES.unknown;
    return new ChatImageError(code, message, options.retryable === true, options.cause);
};

// Narrows any thrown value onto the upload failure contract consumed by the
// reducer and the UI. A non-ChatImageError is treated as an unknown, retryable
// failure so the user can try again.
const toChatImageUploadFailure = (error) => {
    if (error instanceof ChatImageError) {
        return { code: error.code, userMessage: error.userMessage, retryable: error.retryable };
    }
    return {
        code: 'unknown',
        userMessage: CHAT_IMAGE_ERROR_MESSAGES.unknown,
        retryable: true,
    };
};

module.exports = {
    CHAT_IMAGE_ERROR_MESSAGES,
    ChatImageError,
    createChatImageError,
    toChatImageUploadFailure,
};
