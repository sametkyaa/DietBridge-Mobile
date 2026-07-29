'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    compareChatMessagePosition,
    selectLatestVisibleCanonicalMessage,
    chooseNewerCursor,
    canMarkChatRead,
    buildReadContextKey,
} = require('../chatReadStatePolicy');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const RELATION_ID = '22222222-2222-4222-8222-222222222222';
const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333';
const ID_A = '44444444-4444-4444-8444-444444444444';
const ID_B = '55555555-5555-4555-8555-555555555555';

const canonical = (overrides = {}) => ({
    id: ID_A,
    conversationId: CONVERSATION_ID,
    senderId: USER_ID,
    clientMessageId: '66666666-6666-4666-8666-666666666666',
    body: 'Merhaba',
    createdAt: '2026-07-27T10:00:00.000Z',
    isOwn: false,
    deliveryState: 'sent',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    ...overrides,
});

const gate = (overrides = {}) => ({
    currentUserId: USER_ID,
    relationId: RELATION_ID,
    conversationId: CONVERSATION_ID,
    visibleCanonicalMessage: canonical(),
    isScreenFocused: true,
    appState: 'active',
    isInitialLoading: false,
    hasInitialError: false,
    persistedCursor: null,
    inFlightCursor: null,
    ...overrides,
});

test('selects the latest visible canonical server message', () => {
    const older = canonical({ createdAt: '2026-07-27T09:00:00.000Z' });
    const latest = canonical({ id: ID_B, createdAt: '2026-07-27T11:00:00.000Z' });
    const selected = selectLatestVisibleCanonicalMessage({
        conversationId: CONVERSATION_ID,
        viewableItems: [{ item: latest, isViewable: true }, { item: older, isViewable: true }],
    });
    assert.equal(selected.id, ID_B);
});

test('returns null when no canonical message is actually viewable', () => {
    assert.equal(selectLatestVisibleCanonicalMessage({
        conversationId: CONVERSATION_ID,
        viewableItems: [{ item: canonical(), isViewable: false }],
    }), null);
    assert.equal(selectLatestVisibleCanonicalMessage({ conversationId: CONVERSATION_ID, viewableItems: [] }), null);
});

test('ignores optimistic, pending, failed, invalid, and wrong-conversation rows', () => {
    const valid = canonical({ id: ID_B });
    const selected = selectLatestVisibleCanonicalMessage({
        conversationId: CONVERSATION_ID,
        viewableItems: [
            { item: canonical({ id: null, optimisticId: ID_A, deliveryState: 'pending' }), isViewable: true },
            { item: canonical({ deliveryState: 'failed' }), isViewable: true },
            { item: canonical({ isOwn: true }), isViewable: true },
            { item: canonical({ conversationId: USER_ID }), isViewable: true },
            { item: canonical({ id: 'not-a-uuid' }), isViewable: true },
            { item: valid, isViewable: true },
        ],
    });
    assert.equal(selected.id, ID_B);
});

test('visible incoming tombstones remain valid read candidates', () => {
    const deleted = canonical({
        body: null,
        isDeleted: true,
        deletedAt: '2026-07-27T10:01:00.000Z',
        deletedBy: USER_ID,
    });
    const selected = selectLatestVisibleCanonicalMessage({
        conversationId: CONVERSATION_ID,
        viewableItems: [{ item: deleted, isViewable: true }],
    });
    assert.equal(selected.id, ID_A);
});

test('uses id as the position tie-breaker for identical timestamps', () => {
    const left = canonical({ id: ID_A });
    const right = canonical({ id: ID_B });
    assert.equal(compareChatMessagePosition(left, right), -1);
    assert.equal(compareChatMessagePosition(right, left), 1);
    assert.equal(selectLatestVisibleCanonicalMessage({
        conversationId: CONVERSATION_ID,
        viewableItems: [{ item: left, isViewable: true }, { item: right, isViewable: true }],
    }).id, ID_B);
});

test('cursor choice is monotonic and identical/older candidates do not replace it', () => {
    const newer = canonical({ id: ID_B, createdAt: '2026-07-27T11:00:00.000Z' });
    const older = canonical();
    assert.equal(chooseNewerCursor(newer, older).id, ID_B);
    assert.equal(chooseNewerCursor(newer, newer).id, ID_B);
    assert.equal(chooseNewerCursor(null, newer).id, ID_B);
});

test('read gate requires focus, active app, completed initial load and valid context', () => {
    assert.equal(canMarkChatRead(gate()), true);
    assert.equal(canMarkChatRead(gate({ isScreenFocused: false })), false);
    assert.equal(canMarkChatRead(gate({ appState: 'background' })), false);
    assert.equal(canMarkChatRead(gate({ isInitialLoading: true })), false);
    assert.equal(canMarkChatRead(gate({ hasInitialError: true })), false);
    assert.equal(canMarkChatRead(gate({ conversationId: null })), false);
    assert.equal(canMarkChatRead(gate({ visibleCanonicalMessage: null })), false);
});

test('persisted or in-flight newer/equal cursors suppress duplicate and backward writes', () => {
    const current = canonical({ id: ID_B, createdAt: '2026-07-27T11:00:00.000Z' });
    const older = canonical();
    assert.equal(canMarkChatRead(gate({ visibleCanonicalMessage: older, persistedCursor: current })), false);
    assert.equal(canMarkChatRead(gate({ visibleCanonicalMessage: current, persistedCursor: current })), false);
    assert.equal(canMarkChatRead(gate({ visibleCanonicalMessage: older, inFlightCursor: current })), false);
});

test('context key rejects relation or conversation changes', () => {
    assert.equal(buildReadContextKey({ currentUserId: USER_ID, relationId: RELATION_ID, conversationId: CONVERSATION_ID }), `${USER_ID}:${RELATION_ID}:${CONVERSATION_ID}`);
    assert.equal(buildReadContextKey({ currentUserId: USER_ID, relationId: 'bad', conversationId: CONVERSATION_ID }), null);
});
