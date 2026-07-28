'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildChatTimeline,
    addOptimisticMessage,
    updateOptimisticDeliveryState,
    removeOptimisticMessage,
    createOptimisticMessage,
    mergeLatestCanonicalHistory,
    mergeChatReadStates,
    selectParticipantReadStates,
} = require('../chatViewModelUtils');

const RELATION_ID = '11111111-1111-4111-8111-111111111111';
const CONVERSATION_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '33333333-3333-4333-8333-333333333333';
const SERVER_ID = '44444444-4444-4444-8444-444444444444';
const CLIENT_MESSAGE_ID = '55555555-5555-4555-8555-555555555555';

const optimistic = (overrides = {}) => createOptimisticMessage({
    relationId: RELATION_ID,
    conversationId: CONVERSATION_ID,
    currentUserId: USER_ID,
    clientMessageId: CLIENT_MESSAGE_ID,
    body: 'Merhaba',
    createdAt: '2026-07-27T10:00:00.000Z',
    ...overrides,
});

const canonical = (overrides = {}) => ({
    id: SERVER_ID,
    conversationId: CONVERSATION_ID,
    senderId: USER_ID,
    clientMessageId: CLIENT_MESSAGE_ID,
    body: 'Merhaba',
    createdAt: '2026-07-27T10:00:01.000Z',
    isOwn: true,
    deliveryState: 'sent',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    ...overrides,
});

test('canonical server id messages are deduplicated', () => {
    const secondCopy = canonical({ body: 'Güncel içerik' });
    const timeline = buildChatTimeline([canonical(), secondCopy], [], RELATION_ID);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].body, 'Güncel içerik');
});

test('canonical server message replaces matching optimistic clientMessageId', () => {
    const timeline = buildChatTimeline([canonical()], [optimistic()], RELATION_ID);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].id, SERVER_ID);
    assert.equal(timeline[0].deliveryState, 'sent');
});

test('pending can become failed and retry keeps its clientMessageId', () => {
    const pending = optimistic();
    const failed = updateOptimisticDeliveryState([pending], CLIENT_MESSAGE_ID, 'failed');
    const retrying = updateOptimisticDeliveryState(failed, CLIENT_MESSAGE_ID, 'pending');
    assert.equal(failed[0].deliveryState, 'failed');
    assert.equal(retrying[0].deliveryState, 'pending');
    assert.equal(retrying[0].clientMessageId, CLIENT_MESSAGE_ID);
});

test('optimistic messages remain isolated by relation', () => {
    const anotherRelation = '66666666-6666-4666-8666-666666666666';
    const own = optimistic();
    const other = optimistic({ relationId: anotherRelation, clientMessageId: '77777777-7777-4777-8777-777777777777' });
    const timeline = buildChatTimeline([], [own, other], RELATION_ID);
    assert.deepEqual(timeline.map((message) => message.optimisticId), [CLIENT_MESSAGE_ID]);
});

test('timeline is chronological for distinct canonical clientMessageIds', () => {
    const first = canonical({ id: SERVER_ID, clientMessageId: CLIENT_MESSAGE_ID, createdAt: '2026-07-27T09:00:00.000Z' });
    const second = canonical({
        id: '88888888-8888-4888-8888-888888888888',
        clientMessageId: '99999999-9999-4999-8999-999999999999',
        createdAt: '2026-07-27T09:01:00.000Z',
    });
    const timeline = buildChatTimeline([second, first], [], RELATION_ID);
    assert.deepEqual(timeline.map((message) => message.id), [SERVER_ID, second.id]);
});

test('latest refetch merge preserves previously loaded history', () => {
    const older = canonical({
        id: '77777777-7777-4777-8777-777777777777',
        clientMessageId: '88888888-8888-4888-8888-888888888888',
        createdAt: '2026-07-27T09:00:00.000Z',
    });
    const latest = canonical();
    const timeline = buildChatTimeline([older, latest], [], RELATION_ID);
    assert.deepEqual(timeline.map((item) => item.id), [older.id, latest.id]);
});

test('foreground latest refetch adds a missing canonical peer message in sorted order', () => {
    const older = canonical({
        id: '77777777-7777-4777-8777-777777777777',
        clientMessageId: '88888888-8888-4888-8888-888888888888',
        createdAt: '2026-07-27T09:00:00.000Z',
    });
    const foregroundMessage = canonical({
        id: '99999999-9999-4999-8999-999999999999',
        clientMessageId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        senderId: '66666666-6666-4666-8666-666666666666',
        isOwn: false,
        createdAt: '2026-07-27T10:01:00.000Z',
    });

    const result = mergeLatestCanonicalHistory([older], [foregroundMessage]);
    assert.deepEqual(result.messages.map((message) => message.id), [older.id, foregroundMessage.id]);
    assert.deepEqual(result.addedMessages.map((message) => message.id), [foregroundMessage.id]);
});

test('latest refetch preserves tombstones and failed optimistic messages without duplicates', () => {
    const tombstone = canonical({
        body: null,
        isDeleted: true,
        deletedAt: '2026-07-27T10:00:02.000Z',
        deletedBy: USER_ID,
    });
    const foregroundMessage = canonical({
        id: '99999999-9999-4999-8999-999999999999',
        clientMessageId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        senderId: '66666666-6666-4666-8666-666666666666',
        isOwn: false,
        createdAt: '2026-07-27T10:01:00.000Z',
    });
    const failedClientMessageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const failed = updateOptimisticDeliveryState(
        [optimistic({ clientMessageId: failedClientMessageId })],
        failedClientMessageId,
        'failed',
    )[0];

    const merged = mergeLatestCanonicalHistory([tombstone], [foregroundMessage, foregroundMessage]);
    const timeline = buildChatTimeline(merged.messages, [failed], RELATION_ID);
    assert.equal(merged.messages.length, 2);
    assert.equal(merged.messages.find((message) => message.id === SERVER_ID).isDeleted, true);
    assert.equal(timeline.length, 3);
    assert.equal(timeline.filter((message) => message.id === foregroundMessage.id).length, 1);
    assert.equal(timeline.find((message) => message.deliveryState === 'failed').clientMessageId, failedClientMessageId);
});

test('optimistic helpers do not mutate their inputs', () => {
    const pending = optimistic();
    const original = [pending];
    const duplicateSafe = addOptimisticMessage(original, pending);
    const removed = removeOptimisticMessage(original, CLIENT_MESSAGE_ID);
    assert.equal(duplicateSafe.length, 1);
    assert.equal(removed.length, 0);
    assert.equal(original.length, 1);
    assert.equal(original[0].deliveryState, 'pending');
});

test('participant receipt state uses only the current conversation peer', () => {
    const peerId = '66666666-6666-4666-8666-666666666666';
    const own = { conversationId: CONVERSATION_ID, userId: USER_ID, updatedAt: '2026-07-27T10:00:00Z' };
    const peer = { conversationId: CONVERSATION_ID, userId: peerId, updatedAt: '2026-07-27T10:01:00Z' };
    const selected = selectParticipantReadStates({
        readStates: [own, peer],
        currentUserId: USER_ID,
        conversation: { id: CONVERSATION_ID, clientId: USER_ID, dietitianId: peerId },
    });
    assert.equal(selected.ownReadState, own);
    assert.equal(selected.peerReadState, peer);
});

test('read-state merge replaces a user row only with an equal or newer update', () => {
    const older = { conversationId: CONVERSATION_ID, userId: USER_ID, updatedAt: '2026-07-27T10:00:00Z' };
    const newer = { ...older, updatedAt: '2026-07-27T10:01:00Z', lastReadMessageId: SERVER_ID };
    assert.deepEqual(mergeChatReadStates([newer], [older]), [newer]);
    assert.deepEqual(mergeChatReadStates([older], [newer]), [newer]);
});
