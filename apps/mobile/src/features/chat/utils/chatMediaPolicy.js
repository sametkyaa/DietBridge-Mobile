'use strict';

const MIB = 1024 * 1024;
const CHAT_MEDIA_TYPES = Object.freeze({
    'video/mp4': { extension: 'mp4', kind: 'video', maxBytes: 20 * MIB },
    'video/quicktime': { extension: 'mov', kind: 'video', maxBytes: 20 * MIB },
    'video/webm': { extension: 'webm', kind: 'video', maxBytes: 20 * MIB },
    'application/pdf': { extension: 'pdf', kind: 'file', maxBytes: 10 * MIB },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', kind: 'file', maxBytes: 10 * MIB },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', kind: 'file', maxBytes: 10 * MIB },
    'text/plain': { extension: 'txt', kind: 'file', maxBytes: 10 * MIB },
    'text/csv': { extension: 'csv', kind: 'file', maxBytes: 10 * MIB },
});
const UUID_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const CHAT_MEDIA_PATH = new RegExp(`^pending/${UUID_SOURCE}/${UUID_SOURCE}\\.(mp4|mov|webm|pdf|docx|xlsx|txt|csv)$`);
const normalizeChatMediaFile = ({ name, mimeType, byteSize } = {}) => {
    if (typeof name !== 'string') throw new Error('Dosya adı okunamadı.');
    const fileName = name.replace(/[\x00-\x1f\x7f/\\]/g, '_').trim();
    const extension = fileName.split('.').pop().toLowerCase();
    const inferred = Object.keys(CHAT_MEDIA_TYPES).find((type) => CHAT_MEDIA_TYPES[type].extension === extension);
    const normalizedMime = typeof mimeType === 'string' ? mimeType.split(';')[0].trim().toLowerCase() : '';
    const mime = !normalizedMime || normalizedMime === 'application/octet-stream' ? inferred : normalizedMime;
    const policy = CHAT_MEDIA_TYPES[mime];
    if (!policy || policy.extension !== extension || fileName.length > 120 || !fileName) {
        throw new Error('MP4, MOV, WebM, PDF, DOCX, XLSX, TXT veya CSV dosyası seçin.');
    }
    if (!Number.isSafeInteger(byteSize) || byteSize <= 0 || byteSize > policy.maxBytes) {
        throw new Error(`${policy.kind === 'video' ? 'Video' : 'Dosya'} en fazla ${policy.maxBytes / MIB} MB olabilir.`);
    }
    return { fileName, mimeType: mime, byteSize, kind: policy.kind, maxBytes: policy.maxBytes };
};
const normalizeChatMediaAttachment = (value, expectedMessageId, kind) => {
    const row = Array.isArray(value) ? value[0] : value;
    if (!row || typeof row !== 'object' || !['video', 'file'].includes(kind)) return null;
    const uuid = new RegExp(`^${UUID_SOURCE}$`);
    const policy = CHAT_MEDIA_TYPES[row.mime_type];
    if (!uuid.test(row.id || '') || row.message_id !== expectedMessageId || row.bucket_id !== 'chat-media'
        || !CHAT_MEDIA_PATH.test(row.object_path || '') || !policy || policy.kind !== kind
        || !row.object_path.endsWith(`.${policy.extension}`)
        || !Number.isSafeInteger(row.byte_size) || row.byte_size < 1 || row.byte_size > policy.maxBytes
        || row.width !== 0 || row.height !== 0 || row.deleted_at !== null) return null;
    const fileName = typeof row.file_name === 'string' && row.file_name.length <= 120
        && !/[\x00-\x1f\x7f/\\]/.test(row.file_name) ? row.file_name : `${kind === 'video' ? 'Video' : 'Belge'}.${policy.extension}`;
    return { id: row.id, messageId: row.message_id, bucketId: row.bucket_id, objectPath: row.object_path,
        mimeType: row.mime_type, byteSize: row.byte_size, width: 0, height: 0, fileName, deletedAt: null };
};
module.exports = { CHAT_MEDIA_TYPES, CHAT_MEDIA_PATH, normalizeChatMediaFile, normalizeChatMediaAttachment };
