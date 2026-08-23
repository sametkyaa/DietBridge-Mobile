import { supabase } from '../../../lib/supabaseClient';
import { isValidUuid } from '../utils/chatMessageUtils';
import {
    CHAT_IMAGE_BUCKET_ID,
    CHAT_IMAGE_MAX_BYTES,
    CHAT_IMAGE_MAX_EDGE_PIXELS,
    CHAT_IMAGE_MAX_TOTAL_PIXELS,
    CHAT_IMAGE_MIME_TYPE,
    CHAT_IMAGE_OBJECT_PATH_PATTERN,
} from '../constants/chatImageConstants';

export const CHAT_IMAGE_SIGNED_URL_SECONDS = 300;
export const CHAT_IMAGE_CACHE_MS = 4 * 60 * 1000;
export const CHAT_IMAGE_CACHE_MAX_ENTRIES = 100;

export const getReadableChatImagePath = (message) => {
    const attachment = message?.attachment;
    if (message?.messageKind !== 'image' || message?.isDeleted || !attachment || attachment.deletedAt) return null;
    if (!isValidUuid(message.id) || attachment.messageId !== message.id || !isValidUuid(attachment.id)) return null;
    if (attachment.bucketId !== CHAT_IMAGE_BUCKET_ID || attachment.mimeType !== CHAT_IMAGE_MIME_TYPE) return null;
    if (typeof attachment.objectPath !== 'string' || !CHAT_IMAGE_OBJECT_PATH_PATTERN.test(attachment.objectPath)) return null;
    if (!Number.isSafeInteger(attachment.byteSize) || attachment.byteSize < 1 || attachment.byteSize > CHAT_IMAGE_MAX_BYTES) return null;
    if (!Number.isSafeInteger(attachment.width) || !Number.isSafeInteger(attachment.height)
        || attachment.width < 1 || attachment.height < 1
        || attachment.width > CHAT_IMAGE_MAX_EDGE_PIXELS || attachment.height > CHAT_IMAGE_MAX_EDGE_PIXELS
        || attachment.width * attachment.height > CHAT_IMAGE_MAX_TOTAL_PIXELS) return null;
    return attachment.objectPath;
};

export const createChatImageResolver = ({ storage = supabase.storage, now = () => Date.now() } = {}) => {
    const cache = new Map();
    const inFlight = new Map();
    const makeRoom = () => { while (cache.size >= CHAT_IMAGE_CACHE_MAX_ENTRIES) cache.delete(cache.keys().next().value); };
    const resolve = async (message, { forceRefresh = false } = {}) => {
        const path = getReadableChatImagePath(message);
        if (!path) return { uri: null, status: 'placeholder' };
        if (forceRefresh) cache.delete(path);
        const cached = cache.get(path);
        if (cached && cached.refreshAfter > now()) return cached.result;
        if (inFlight.has(path)) return inFlight.get(path);
        const request = (async () => {
            try {
                const { data, error } = await storage.from(CHAT_IMAGE_BUCKET_ID).createSignedUrl(path, CHAT_IMAGE_SIGNED_URL_SECONDS);
                if (error || !data?.signedUrl) return { uri: null, status: 'error' };
                const result = { uri: data.signedUrl, status: 'ready' };
                makeRoom();
                cache.set(path, { result, refreshAfter: now() + CHAT_IMAGE_CACHE_MS });
                return result;
            } catch {
                return { uri: null, status: 'error' };
            } finally { inFlight.delete(path); }
        })();
        inFlight.set(path, request);
        return request;
    };
    return {
        resolve,
        refresh: (message) => resolve(message, { forceRefresh: true }),
        purge: (message) => { const path = getReadableChatImagePath(message); if (path) cache.delete(path); },
        clear: () => { cache.clear(); inFlight.clear(); },
    };
};

const resolver = createChatImageResolver();
export const resolveChatImageUri = (message) => resolver.resolve(message);
export const refreshChatImageUri = (message) => resolver.refresh(message);
export const purgeChatImageUri = (message) => resolver.purge(message);
