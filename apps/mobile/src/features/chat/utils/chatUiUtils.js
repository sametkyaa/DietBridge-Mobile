'use strict';

const { isValidUuid, normalizeIsoTimestamp } = require('./chatMessageUtils');
const { compareChatMessagePosition } = require('./chatReadStatePolicy');
const { cursorFromReadState } = require('./chatDeliveryPolicy');

const isSafeRemoteImageUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    try {
        const url = new URL(value.trim());
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};

const getChatAvatarInitials = (displayName) => {
    const words = String(displayName || '').trim().split(/\s+/).filter(Boolean);
    const initials = words.slice(0, 2).map((word) => Array.from(word)[0] || '').join('').toLocaleUpperCase('tr-TR');
    return initials || 'D';
};

const resolveDietitianAvatarPresentation = ({ displayName, avatarUrl, imageFailed = false } = {}) => ({
    avatarUrl: !imageFailed && isSafeRemoteImageUrl(avatarUrl) ? avatarUrl.trim() : null,
    initials: getChatAvatarInitials(displayName),
});

const formatChatMessageTime = (timestamp) => {
    const normalized = normalizeIsoTimestamp(timestamp);
    if (!normalized) return '';
    const date = new Date(normalized);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const canDeleteChatMessage = (message) => Boolean(message)
    && message.isOwn === true
    && message.deliveryState === 'sent'
    && isValidUuid(message.id)
    && message.isDeleted !== true;

const getChatReceiptState = ({ message, peerReadState } = {}) => {
    if (!message || message.isOwn !== true || message.deliveryState !== 'sent'
        || !isValidUuid(message.id) || normalizeIsoTimestamp(message.createdAt) === null) return 'none';

    const readCursor = cursorFromReadState(peerReadState, 'read');
    if (readCursor && compareChatMessagePosition(readCursor, message) >= 0) return 'read';
    const deliveredCursor = cursorFromReadState(peerReadState, 'delivered');
    if (deliveredCursor && compareChatMessagePosition(deliveredCursor, message) >= 0) return 'delivered';
    return 'sent';
};

module.exports = {
    isSafeRemoteImageUrl,
    getChatAvatarInitials,
    resolveDietitianAvatarPresentation,
    formatChatMessageTime,
    canDeleteChatMessage,
    getChatReceiptState,
};
