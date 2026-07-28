'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    canDeleteChatMessage,
    formatChatMessageTime,
    getChatReceiptState,
    resolveDietitianAvatarPresentation,
} = require('../chatUiUtils');

const MESSAGE_ID = '11111111-1111-4111-8111-111111111111';
const CONVERSATION_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const CLIENT_ID = '44444444-4444-4444-8444-444444444444';

const message = (overrides = {}) => ({
    id: MESSAGE_ID,
    conversationId: CONVERSATION_ID,
    senderId: USER_ID,
    clientMessageId: CLIENT_ID,
    body: 'Merhaba',
    createdAt: '2026-07-27T10:05:00.000Z',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    isOwn: true,
    deliveryState: 'sent',
    ...overrides,
});

test('avatar presentation uses a valid URL and falls back to initials', () => {
    assert.deepEqual(resolveDietitianAvatarPresentation({
        displayName: 'Ayşe Yılmaz',
        avatarUrl: 'https://example.test/avatar.jpg',
    }), { avatarUrl: 'https://example.test/avatar.jpg', initials: 'AY' });
    assert.deepEqual(resolveDietitianAvatarPresentation({ displayName: 'Ayşe Yılmaz' }), {
        avatarUrl: null,
        initials: 'AY',
    });
});

test('broken or unsafe avatar URLs produce a safe initials fallback', () => {
    assert.equal(resolveDietitianAvatarPresentation({
        displayName: 'Ayşe Yılmaz',
        avatarUrl: 'https://example.test/avatar.jpg',
        imageFailed: true,
    }).avatarUrl, null);
    assert.equal(resolveDietitianAvatarPresentation({ displayName: 'Ayşe', avatarUrl: 'javascript:alert(1)' }).avatarUrl, null);
});

test('message time formats in local HH:mm and invalid values stay empty', () => {
    const date = new Date('2026-07-27T10:05:00.000Z');
    const expected = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    assert.equal(formatChatMessageTime(date.toISOString()), expected);
    assert.equal(formatChatMessageTime('invalid'), '');
    assert.equal(formatChatMessageTime(null), '');
});

test('delete is offered only for own canonical undeleted messages', () => {
    assert.equal(canDeleteChatMessage(message()), true);
    assert.equal(canDeleteChatMessage(message({ isOwn: false })), false);
    assert.equal(canDeleteChatMessage(message({ id: null, deliveryState: 'pending' })), false);
    assert.equal(canDeleteChatMessage(message({ id: null, deliveryState: 'failed' })), false);
    assert.equal(canDeleteChatMessage(message({ body: null, isDeleted: true, deletedAt: '2026-07-27T10:06:00Z', deletedBy: USER_ID })), false);
});

test('receipt semantics map sent, delivered and read cursors to ticks', () => {
    assert.equal(getChatReceiptState({ message: message(), peerReadState: null }), 'sent');
    assert.equal(getChatReceiptState({
        message: message(),
        peerReadState: { lastDeliveredMessageId: MESSAGE_ID, lastDeliveredAt: '2026-07-27T10:05:00.000Z' },
    }), 'delivered');
    assert.equal(getChatReceiptState({
        message: message(),
        peerReadState: {
            lastDeliveredMessageId: MESSAGE_ID,
            lastDeliveredAt: '2026-07-27T10:05:00.000Z',
            lastReadMessageId: MESSAGE_ID,
            lastReadAt: '2026-07-27T10:05:00.000Z',
        },
    }), 'read');
});

test('pending, failed and peer messages never show receipt ticks', () => {
    assert.equal(getChatReceiptState({ message: message({ id: null, deliveryState: 'pending' }) }), 'none');
    assert.equal(getChatReceiptState({ message: message({ id: null, deliveryState: 'failed' }) }), 'none');
    assert.equal(getChatReceiptState({ message: message({ isOwn: false }) }), 'none');
});
