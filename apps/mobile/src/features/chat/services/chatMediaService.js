import { supabase } from '../../../lib/supabaseClient';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { CHAT_MEDIA_PATH, CHAT_MEDIA_TYPES, normalizeChatMediaFile, normalizeChatMediaAttachment } from '../utils/chatMediaPolicy';
import { isValidUuid } from '../utils/chatMessageUtils';

const safeFailure = (error) => new Error(String(error?.message || '').includes('CHAT_RATE_LIMIT')
    ? 'Çok sık veya çok fazla dosya gönderildi. Biraz bekleyip tekrar deneyin.'
    : error?.code === '42501' ? 'Dosya gönderimi için erişim veya sağlık paylaşım izni bulunmuyor.'
        : 'Dosya gönderilemedi. Dosya türünü ve bağlantınızı kontrol edip tekrar deneyin.');
export const getChatMediaEnabled = async () => {
    const { data, error } = await supabase.rpc('get_chat_media_capabilities');
    return !error && data?.enabled === true;
};
export const pickChatMedia = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: Object.keys(CHAT_MEDIA_TYPES), multiple: false, copyToCacheDirectory: true });
    if (result.canceled) return null;
    const asset = result.assets?.[0];
    if (!asset?.uri) throw new Error('Dosya seçilemedi.');
    const local = new File(asset.uri);
    try {
        const descriptor = normalizeChatMediaFile({ name: asset.name, mimeType: asset.mimeType, byteSize: local.size });
        return { uri: asset.uri, descriptor };
    } catch (error) { try { if (local.exists) local.delete(); } catch { /* OS cache fallback. */ } throw error; }
};
export const cleanupChatMediaFile = (source) => {
    if (!source?.uri) return;
    try { const file = new File(source.uri); if (file.exists) file.delete(); } catch { /* OS cache expiry remains the fallback. */ }
};
export const abortChatMedia = async (operation) => {
    if (!operation?.intentId || operation.finalized) return;
    const { error } = await supabase.rpc('abort_chat_image_upload', { p_intent_id: operation.intentId });
    if (error) throw safeFailure(error);
};
export const sendChatMedia = async ({ conversationId, clientMessageId, source, caption, operation, isCurrent, onStage }) => {
    if (!isValidUuid(conversationId) || !isValidUuid(clientMessageId) || Array.from(caption).length > 4000) throw new Error('Dosya veya açıklama bilgisi geçersiz.');
    const descriptor = source.descriptor;
    if (!operation.intentId) {
        onStage('İzin kontrol ediliyor');
        const { data, error } = await supabase.rpc('create_chat_media_upload_intent', {
            p_conversation_id: conversationId, p_client_message_id: clientMessageId,
            p_mime: descriptor.mimeType, p_file_name: descriptor.fileName, p_byte_size: descriptor.byteSize,
        });
        if (error) throw safeFailure(error);
        const intent = Array.isArray(data) ? data[0] : data;
        if (!intent || !isValidUuid(intent.id) || intent.conversation_id !== conversationId || intent.client_message_id !== clientMessageId
            || intent.bucket_id !== 'chat-media' || !CHAT_MEDIA_PATH.test(intent.object_path || '')
            || !intent.object_path.endsWith(`.${descriptor.fileName.split('.').pop().toLowerCase()}`)
            || intent.expected_mime !== descriptor.mimeType || intent.declared_byte_size !== descriptor.byteSize || intent.file_name !== descriptor.fileName) throw new Error('Dosya yükleme izni doğrulanamadı.');
        operation.intentId = intent.id; operation.objectPath = intent.object_path;
    }
    if (!isCurrent()) { await abortChatMedia(operation); return null; }
    if (!operation.uploaded) {
        onStage('Dosya yükleniyor');
        const local = new File(source.uri);
        if (local.size !== descriptor.byteSize) throw new Error('Seçilen dosya değişti. Yeniden seçin.');
        const bytes = await local.bytes();
        if (bytes.byteLength !== descriptor.byteSize) throw new Error('Dosya okunamadı.');
        if (!isCurrent()) return null;
        const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const { data, error } = await supabase.functions.invoke('validate-chat-media', {
            headers: { 'x-chat-media-intent-id': operation.intentId, 'Content-Type': descriptor.mimeType }, body,
        });
        if (error || data?.data?.validated !== true) throw safeFailure(error);
        operation.uploaded = true; operation.validated = true;
    }
    if (!isCurrent()) return null;
    if (!operation.validated) {
        onStage('Dosya doğrulanıyor');
        const { data, error } = await supabase.functions.invoke('validate-chat-media', { body: { intentId: operation.intentId } });
        if (error || data?.data?.validated !== true) throw safeFailure(error);
        operation.validated = true;
    }
    if (!isCurrent()) return null;
    onStage('Mesaj gönderiliyor');
    const { data, error } = await supabase.rpc('finalize_chat_media_message', { p_intent_id: operation.intentId, p_caption: caption.trim() || null });
    if (error) throw safeFailure(error);
    const message = Array.isArray(data) ? data[0] : data;
    if (!message || !isValidUuid(message.id) || message.conversation_id !== conversationId || message.client_message_id !== clientMessageId) throw new Error('Mesaj sonucu doğrulanamadı.');
    operation.finalized = true;
    return { messageId: message.id, conversationId };
};
export const enrichChatMediaRows = async (rows) => {
    const ids = rows.filter((row) => ['video', 'file'].includes(row.message_kind) && row.deleted_at === null).map((row) => row.id);
    if (!ids.length) return rows;
    const { data, error } = await supabase.from('chat_attachments').select('message_id, file_name').in('message_id', ids);
    if (error) throw safeFailure(error);
    const names = new Map((data || []).map((row) => [row.message_id, row.file_name]));
    return rows.map((row) => {
        if (!names.has(row.id)) return row;
        const attachment = Array.isArray(row.attachment) ? row.attachment[0] : row.attachment;
        return { ...row, attachment: { ...attachment, file_name: names.get(row.id) } };
    });
};
export const getChatMediaUrl = async (message) => {
    const a = message?.attachment;
    if (message?.isDeleted || !a || !normalizeChatMediaAttachment({ id: a.id, message_id: a.messageId, bucket_id: a.bucketId,
        object_path: a.objectPath, mime_type: a.mimeType, byte_size: a.byteSize, width: a.width, height: a.height, deleted_at: a.deletedAt }, message.id, message.messageKind)) throw new Error('Bu dosya kullanılamıyor.');
    const { data, error } = await supabase.storage.from('chat-media').createSignedUrl(a.objectPath, 300,
        message.messageKind === 'file' ? { download: a.fileName || true } : undefined);
    if (error || !data?.signedUrl) throw new Error('Dosya açılamadı. Erişiminizi kontrol edip tekrar deneyin.');
    return data.signedUrl;
};
