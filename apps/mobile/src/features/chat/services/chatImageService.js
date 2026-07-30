import { supabase } from '../../../lib/supabaseClient';
import { isValidUuid } from '../utils/chatMessageUtils';
import { createChatImageError, toChatImageUploadFailure } from '../utils/chatImageError';
import { CHAT_IMAGE_MIME_TYPE } from '../constants/chatImageConstants';
import {
    assertUploadTarget,
    mapChatImageError,
    normalizeChatImageCaption,
    normalizeFinalizeResult,
    normalizeUploadIntent,
} from '../utils/chatImageServiceContract';

// Supabase access for the canonical JPEG chat image flow.
//
// Every RPC and Storage call for image messaging lives here: the hook, the
// reducer and the composer never touch Supabase directly. The client never
// chooses a bucket or object path — it only replays what the server returned,
// after validating it fail-closed through `chatImageServiceContract`.
//
// The image RPCs are dormant on purpose: the backend migration
// `20260729090200_chat_image_rpc.sql` revokes execute from `authenticated`, so
// a permission error is the expected production state today and is surfaced as
// `feature_unavailable`.

// Creates the server-owned upload intent. The RPC receives exactly the
// conversation id, the caller-owned idempotency key and the canonical MIME
// type; the client never sends a bucket or path.
export const createChatImageUploadIntent = async ({ conversationId, clientMessageId } = {}) => {
    if (!isValidUuid(conversationId) || !isValidUuid(clientMessageId)) {
        throw createChatImageError('invalid_request');
    }

    try {
        const { data, error } = await supabase.rpc('create_chat_image_upload_intent', {
            p_conversation_id: conversationId,
            p_client_message_id: clientMessageId,
            p_expected_mime: CHAT_IMAGE_MIME_TYPE,
        });
        if (error) throw mapChatImageError(error, 'access_denied');
        return normalizeUploadIntent(data, { conversationId, clientMessageId });
    } catch (error) {
        throw mapChatImageError(error, 'access_denied');
    }
};

// Uploads the canonical JPEG to the exact bucket/path the server issued.
// `upsert: false` keeps a pending object immutable; a free-form path from the
// UI is never accepted. `canonical.body` is the platform binary produced by the
// canonicalizer adapter (an ArrayBuffer). Size/MIME are re-checked in the
// contract guard so nothing outside the contract can reach Storage.
export const uploadCanonicalChatImage = async (intent, canonical) => {
    assertUploadTarget(intent, canonical);

    try {
        const { error } = await supabase.storage
            .from(intent.bucketId)
            .upload(intent.objectPath, canonical.body, {
                contentType: CHAT_IMAGE_MIME_TYPE,
                upsert: false,
            });
        if (error) throw mapChatImageError(error, 'storage_upload_failed');
    } catch (error) {
        throw mapChatImageError(error, 'storage_upload_failed');
    }
};

// Finalizes the image message through the canonical RPC. Retry is safe: the
// RPC is idempotent per (sender, client_message_id) and returns the original
// canonical row when a finalized intent is replayed.
export const finalizeChatImageMessage = async (intentId, caption) => {
    if (!isValidUuid(intentId)) throw createChatImageError('invalid_request');
    const normalizedCaption = normalizeChatImageCaption(caption);

    try {
        const { data, error } = await supabase.rpc('finalize_chat_image_message', {
            p_intent_id: intentId,
            p_caption: normalizedCaption,
        });
        if (error) throw mapChatImageError(error, 'validation_pending');
        return normalizeFinalizeResult(data);
    } catch (error) {
        throw mapChatImageError(error, 'validation_pending');
    }
};

// Aborts a pending intent through the canonical RPC. A finalized intent is
// never aborted (the backend rejects it and this service never calls it for a
// finalized operation).
export const abortChatImageUpload = async (intentId) => {
    if (!isValidUuid(intentId)) throw createChatImageError('invalid_request');

    try {
        const { error } = await supabase.rpc('abort_chat_image_upload', { p_intent_id: intentId });
        if (error) throw mapChatImageError(error, 'unknown');
    } catch (error) {
        throw mapChatImageError(error, 'unknown');
    }
};

// Best-effort abort used on the failure/cancel paths. It never throws: the
// original upload error must stay visible, and the expiry-driven cleanup queue
// remains the safety net when the abort itself fails.
export const abortChatImageUploadQuietly = async (intentId) => {
    try {
        await abortChatImageUpload(intentId);
        return true;
    } catch {
        return false;
    }
};

// Re-exported so the ViewModel/hook can normalize a thrown value and captions
// without importing the util modules directly.
export { normalizeChatImageCaption, toChatImageUploadFailure };
