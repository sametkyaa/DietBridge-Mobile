'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    canAdvanceDeliveryCursor,
    cursorFromReadState,
    isCanonicalIncomingMessage,
    selectLatestDeliverableMessage,
} = require('../chatDeliveryPolicy');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const PEER_ID = '22222222-2222-4222-8222-222222222222';
const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333';
const ID_A = '44444444-4444-4444-8444-444444444444';
const ID_B = '55555555-5555-4555-8555-555555555555';
const CLIENT_ID = '66666666-6666-4666-8666-666666666666';

const incoming = (overrides = {}) => ({
    id: ID_A,
    conversationId: CONVERSATION_ID,
    senderId: PEER_ID,
    clientMessageId: CLIENT_ID,
    body: 'Merhaba',
    createdAt: '2026-07-27T10:00:00.000Z',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    isOwn: false,
    deliveryState: 'sent',
    ...overrides,
});

test('delivery accepts only incoming canonical messages from the active conversation', () => {
    const base = { message: incoming(), conversationId: CONVERSATION_ID, currentUserId: USER_ID };
    assert.equal(isCanonicalIncomingMessage(base), true);
    assert.equal(isCanonicalIncomingMessage({ ...base, message: incoming({ isOwn: true, senderId: USER_ID }) }), false);
    assert.equal(isCanonicalIncomingMessage({ ...base, message: incoming({ deliveryState: 'pending' }) }), false);
    assert.equal(isCanonicalIncomingMessage({ ...base, message: incoming({ deliveryState: 'failed' }) }), false);
    assert.equal(isCanonicalIncomingMessage({ ...base, message: incoming({ conversationId: USER_ID }) }), false);
    assert.equal(isCanonicalIncomingMessage({ ...base, message: { ...incoming(), id: null } }), false);
});

test('delivery cursor chooses createdAt then id and never moves backwards', () => {
    const sameTimeNewerId = incoming({ id: ID_B });
    assert.equal(selectLatestDeliverableMessage({
        messages: [incoming(), sameTimeNewerId],
        conversationId: CONVERSATION_ID,
        currentUserId: USER_ID,
    }).id, ID_B);
    assert.equal(canAdvanceDeliveryCursor({
        candidate: incoming(),
        conversationId: CONVERSATION_ID,
        currentUserId: USER_ID,
        persistedCursor: sameTimeNewerId,
    }), false);
    assert.equal(canAdvanceDeliveryCursor({
        candidate: sameTimeNewerId,
        conversationId: CONVERSATION_ID,
        currentUserId: USER_ID,
        persistedCursor: incoming(),
    }), true);
});

test('deleted incoming canonical messages can advance delivery', () => {
    const deleted = incoming({
        body: null,
        isDeleted: true,
        deletedAt: '2026-07-27T10:02:00.000Z',
        deletedBy: PEER_ID,
    });
    assert.equal(isCanonicalIncomingMessage({ message: deleted, conversationId: CONVERSATION_ID, currentUserId: USER_ID }), true);
});

test('receipt rows expose comparable delivered and read cursors', () => {
    const state = {
        lastDeliveredMessageId: ID_A,
        lastDeliveredAt: '2026-07-27T10:00:00Z',
        lastReadMessageId: ID_B,
        lastReadAt: '2026-07-27T10:01:00Z',
    };
    assert.deepEqual(cursorFromReadState(state, 'delivered'), { id: ID_A, createdAt: '2026-07-27T10:00:00Z' });
    assert.deepEqual(cursorFromReadState(state, 'read'), { id: ID_B, createdAt: '2026-07-27T10:01:00Z' });
});
