'use strict';

// UI-only decisions for the optional chat-image surface. No React, Expo or
// Supabase API lives here, so every rule is exercised by the Node test runner.

const { isSupportedChatImageSourceMimeType } = require('./canonicalJpegPlan');
const { CHAT_IMAGE_CAPTION_MAX_LENGTH } = require('../constants/chatImageConstants');

const CHAT_IMAGE_DISABLED_CONVERSATION_MESSAGE = 'Görsel göndermek için önce bir metin mesajı gönderin.';
const CHAT_IMAGE_FEATURE_UNAVAILABLE_MESSAGE = 'Görsel gönderme özelliği henüz kullanıma açık değil.';
const CHAT_IMAGE_PLACEHOLDER_LABEL = 'Görsel';
const CHAT_IMAGE_MISSING_ATTACHMENT_LABEL = 'Görsel kullanılamıyor';

// Resolves the composer image-button state. The picker is only visible when the
// feature flag is on; without a conversation it stays visible but disabled with
// an explanatory message (an image can never be the first message).
const getChatImagePickerUiState = (featureEnabled, conversationId, composerDisabled) => {
    if (!featureEnabled) {
        return { visible: false, enabled: false, disabledMessage: null };
    }
    if (!conversationId) {
        return {
            visible: true,
            enabled: false,
            disabledMessage: CHAT_IMAGE_DISABLED_CONVERSATION_MESSAGE,
        };
    }
    return {
        visible: true,
        enabled: !composerDisabled,
        disabledMessage: null,
    };
};

const isChatImagePickerFileAccepted = (mimeType) => isSupportedChatImageSourceMimeType(mimeType);

const normalizeChatImageUiCaption = (caption) => {
    if (typeof caption !== 'string') return null;
    const trimmed = caption.trim();
    if (!trimmed) return null;
    if (Array.from(trimmed).length > CHAT_IMAGE_CAPTION_MAX_LENGTH) return null;
    return trimmed;
};

const isChatImageUiCaptionValid = (caption) => (
    Array.from(String(caption ?? '').trim()).length <= CHAT_IMAGE_CAPTION_MAX_LENGTH
);

const isChatImageUploadInFlight = (state) => (
    state.status === 'canonicalizing'
    || state.status === 'creating-intent'
    || state.status === 'uploading'
    || state.status === 'validating'
    || state.status === 'finalizing'
);

const hasChatImageSelection = (state) => (
    state.source !== null && state.status !== 'idle' && state.status !== 'cancelled'
);

// Single composer send-gate. Text-only send is unchanged; an image can only be
// sent from the `selected` state with a valid caption; any in-flight image work
// blocks a second send.
const canSendChatComposer = (draft, textSending, composerDisabled, imageState) => {
    if (composerDisabled || textSending) return false;
    if (!imageState || !hasChatImageSelection(imageState)) return Boolean(String(draft ?? '').trim());
    return imageState.status === 'selected' && isChatImageUiCaptionValid(draft);
};

const CHAT_IMAGE_UPLOAD_STATUS_LABELS = Object.freeze({
    canonicalizing: 'Görsel hazırlanıyor',
    'creating-intent': 'Gönderim hazırlanıyor',
    uploading: 'Görsel yükleniyor',
    validating: 'Görsel doğrulanıyor',
    finalizing: 'Mesaj tamamlanıyor',
});

const getChatImageUploadStatusLabel = (state) => (
    CHAT_IMAGE_UPLOAD_STATUS_LABELS[state.status] ?? null
);

const getChatImageUploadErrorMessage = (state) => {
    if (!state.error) return null;
    return state.error.code === 'feature_unavailable'
        ? CHAT_IMAGE_FEATURE_UNAVAILABLE_MESSAGE
        : state.error.userMessage;
};

const shouldShowChatImageRetry = (state) => (
    state.status === 'failed'
    && state.error?.retryable === true
    && state.error.code !== 'feature_unavailable'
    && state.retryStage !== null
);

// Placeholder-bubble label for an incoming image message. The caption is shown
// when present; a caption-less image falls back to `Görsel`; a message whose
// attachment metadata is missing shows the neutral unavailable label.
const getChatImageBubbleLabel = (message) => {
    if (!message || !message.attachment) return CHAT_IMAGE_MISSING_ATTACHMENT_LABEL;
    return normalizeChatImageUiCaption(message.body ?? '') ?? CHAT_IMAGE_PLACEHOLDER_LABEL;
};

const shouldClearChatImageComposerAfterSuccess = (state) => (
    state.status === 'succeeded'
    && state.source === null
    && state.previewUri === null
    && state.canonical === null
    && state.intent === null
);

module.exports = {
    CHAT_IMAGE_DISABLED_CONVERSATION_MESSAGE,
    CHAT_IMAGE_FEATURE_UNAVAILABLE_MESSAGE,
    CHAT_IMAGE_PLACEHOLDER_LABEL,
    CHAT_IMAGE_MISSING_ATTACHMENT_LABEL,
    getChatImagePickerUiState,
    isChatImagePickerFileAccepted,
    normalizeChatImageUiCaption,
    isChatImageUiCaptionValid,
    isChatImageUploadInFlight,
    hasChatImageSelection,
    canSendChatComposer,
    getChatImageUploadStatusLabel,
    getChatImageUploadErrorMessage,
    shouldShowChatImageRetry,
    getChatImageBubbleLabel,
    shouldClearChatImageComposerAfterSuccess,
};
