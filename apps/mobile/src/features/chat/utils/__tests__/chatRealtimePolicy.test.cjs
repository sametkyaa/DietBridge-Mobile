'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildConversationChannelConfig,
    buildMessageChannelConfig,
    buildReadStateChannelConfig,
    normalizeSubscriptionStatus,
    isConversationForRelation,
    isMessageForConversation,
    isRealtimeContextCurrent,
    createChatRealtimeRefreshScheduler,
} = require('../chatRealtimePolicy');
const { buildChatTimeline } = require('../chatViewModelUtils');

const USER_ID = '11111111-1111-4111-8111-111111111111';
const RELATION_ID = '22222222-2222-4222-8222-222222222222';
const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333';
const MESSAGE_ID = '44444444-4444-4444-8444-444444444444';
const CLIENT_MESSAGE_ID = '55555555-5555-4555-8555-555555555555';

const message = (overrides = {}) => ({
    id: MESSAGE_ID,
    conversationId: CONVERSATION_ID,
    senderId: USER_ID,
    clientMessageId: CLIENT_MESSAGE_ID,
    body: 'Merhaba',
    createdAt: '2026-07-27T10:00:00.000Z',
    isOwn: false,
    deliveryState: 'sent',
    deletedAt: null,
    deletedBy: null,
    isDeleted: false,
    ...overrides,
});

test('builds stable canonical conversation and message filters', () => {
    assert.deepEqual(buildConversationChannelConfig(RELATION_ID), {
        channelName: `mobile-chat-conversation:${RELATION_ID}`,
        filter: `dietitian_client_id=eq.${RELATION_ID}`,
    });
    assert.deepEqual(buildMessageChannelConfig(CONVERSATION_ID), {
        channelName: `mobile-chat-messages:${CONVERSATION_ID}`,
        filter: `conversation_id=eq.${CONVERSATION_ID}`,
    });
    assert.deepEqual(buildReadStateChannelConfig(CONVERSATION_ID), {
        channelName: `mobile-chat-read-states:${CONVERSATION_ID}`,
        filter: `conversation_id=eq.${CONVERSATION_ID}`,
    });
});

test('does not build filters from invalid UUID input', () => {
    assert.equal(buildConversationChannelConfig('not-a-uuid'), null);
    assert.equal(buildMessageChannelConfig(undefined), null);
    assert.equal(buildReadStateChannelConfig('bad'), null);
});

test('conversation and message relevance reject wrong relation or conversation', () => {
    assert.equal(isConversationForRelation({ relationId: RELATION_ID }, RELATION_ID), true);
    assert.equal(isConversationForRelation({ relationId: USER_ID }, RELATION_ID), false);
    assert.equal(isMessageForConversation(message(), CONVERSATION_ID), true);
    assert.equal(isMessageForConversation(message({ conversationId: USER_ID }), CONVERSATION_ID), false);
    // A normalized legacy row is null, so it is never relevant.
    assert.equal(isMessageForConversation(null, CONVERSATION_ID), false);
});

test('subscription status requests a refetch only after SUBSCRIBED', () => {
    assert.deepEqual(normalizeSubscriptionStatus('SUBSCRIBED'), { status: 'connected', shouldRefetch: true });
    assert.deepEqual(normalizeSubscriptionStatus('CHANNEL_ERROR'), { status: 'degraded', shouldRefetch: false });
    assert.deepEqual(normalizeSubscriptionStatus('TIMED_OUT'), { status: 'degraded', shouldRefetch: false });
    assert.deepEqual(normalizeSubscriptionStatus('CLOSED'), { status: 'disconnected', shouldRefetch: false });
});

test('stale relation, user, or conversation contexts are ignored', () => {
    const base = {
        currentUserId: USER_ID,
        relationId: RELATION_ID,
        conversationId: CONVERSATION_ID,
        eventUserId: USER_ID,
        eventRelationId: RELATION_ID,
        eventConversationId: CONVERSATION_ID,
    };
    assert.equal(isRealtimeContextCurrent(base), true);
    assert.equal(isRealtimeContextCurrent({ ...base, eventRelationId: USER_ID }), false);
    assert.equal(isRealtimeContextCurrent({ ...base, eventUserId: RELATION_ID }), false);
    assert.equal(isRealtimeContextCurrent({ ...base, eventConversationId: USER_ID }), false);
});

test('accepts the hook context snapshot field names used by realtime callbacks', () => {
    const contextRefSnapshot = {
        currentUserId: USER_ID,
        relationId: RELATION_ID,
        conversationId: CONVERSATION_ID,
    };

    assert.equal(isRealtimeContextCurrent({
        ...contextRefSnapshot,
        eventUserId: USER_ID,
        eventRelationId: RELATION_ID,
        eventConversationId: CONVERSATION_ID,
    }), true);
});

test('RPC then realtime and realtime then RPC both produce one canonical bubble', () => {
    const rpcThenRealtime = buildChatTimeline([message()], [], RELATION_ID);
    const realtimeThenRpc = buildChatTimeline([message(), message({ body: 'Yeni' })], [], RELATION_ID);
    assert.equal(rpcThenRealtime.length, 1);
    assert.equal(realtimeThenRpc.length, 1);
    assert.equal(realtimeThenRpc[0].body, 'Yeni');
});

test('realtime UPDATE replaces an existing bubble instead of appending one', () => {
    const tombstone = message({
        body: null,
        isDeleted: true,
        deletedAt: '2026-07-27T10:05:00.000Z',
        deletedBy: USER_ID,
    });
    const timeline = buildChatTimeline([message(), tombstone], [], RELATION_ID);
    assert.equal(timeline.length, 1);
    assert.equal(timeline[0].isDeleted, true);
});

test('same clientMessageId is deduped while legacy null ids are rejected', () => {
    const duplicateClientId = buildChatTimeline([
        message(),
        message({ id: '66666666-6666-4666-8666-666666666666' }),
    ], [], RELATION_ID);
    assert.equal(duplicateClientId.length, 1);

    const nullIds = buildChatTimeline([
        message({ clientMessageId: null }),
        message({ id: '77777777-7777-4777-8777-777777777777', clientMessageId: null }),
    ], [], RELATION_ID);
    assert.equal(nullIds.length, 0);
});

test('refresh scheduler coalesces bursts and allows one trailing refresh', async () => {
    let count = 0;
    let resolveFirst;
    const first = new Promise((resolve) => { resolveFirst = resolve; });
    const scheduler = createChatRealtimeRefreshScheduler({
        delayMs: 1,
        onRefresh: () => {
            count += 1;
            return count === 1 ? first : undefined;
        },
    });

    scheduler.notify();
    scheduler.notify();
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(count, 1);
    scheduler.notify();
    resolveFirst();
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(count, 2);
    scheduler.dispose();
});
