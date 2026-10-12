const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { isValidUuid } = require('../chatMessageUtils');
const C = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const M = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const U = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const deferred = () => { let resolve; const promise = new Promise((yes) => { resolve = yes; }); return { promise, resolve }; };
const harness = () => {
    const source = fs.readFileSync(path.join(__dirname, '../../viewmodels/useChatViewModel.js'), 'utf8');
    const reconcile = source.slice(source.indexOf('    const reconcileMessageById = useCallback'), source.indexOf('    // Conversation INSERT'));
    const mediaStart = source.indexOf('    const mediaUpload = useChatMediaUpload');
    const media = source.slice(mediaStart, source.indexOf('\n    return {', mediaStart));
    assert.ok(reconcile.includes('pendingMessageFetchRef'));
    const fetch = deferred(); let fetches = 0, merged = 0, bottom = 0;
    const context = {
        useCallback: (callback) => callback, useChatMediaUpload: (options) => options,
        conversation: { id: C }, conversationRef: { current: { id: C } },
        relationId: U, relationKey: 'active', validCurrentUserId: U,
        activeRelationKeyRef: { current: 'active' }, requestGenerationRef: { current: 1 },
        pendingMessageFetchRef: { current: new Map() }, isMountedRef: { current: true },
        isValidUuid, fetchChatMessageById: () => { fetches++; return fetch.promise; },
        mergeServerMessages: (messages) => { merged++; return messages; },
        setOptimisticMessages: () => {}, removeOptimisticMessage: () => {},
        setRealtimeScrollToken: () => {}, setBottomScrollToken: (update) => { bottom = update(bottom); },
    };
    vm.createContext(context);
    vm.runInContext(reconcile + media + '\nglobalThis.api={reconcile:reconcileMessageById,finalized:mediaUpload.onFinalized};', context);
    return { context, api: context.api, fetch, fetches: () => fetches, merged: () => merged, bottom: () => bottom };
};
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const message = { id: M, conversationId: C, clientMessageId: M };

test('own media scrolls only after the committed message has joined the timeline', async () => {
    const h = harness();
    const pending = h.api.finalized({ messageId: M, conversationId: C });
    await settle(); assert.equal(h.bottom(), 0);
    h.fetch.resolve(message); await pending;
    assert.equal(h.merged(), 1); assert.equal(h.bottom(), 1);
});
test('late media completion cannot move a different conversation', async () => {
    const h = harness();
    const pending = h.api.finalized({ messageId: M, conversationId: C });
    h.context.conversationRef.current = { id: U };
    h.context.requestGenerationRef.current++;
    h.fetch.resolve(message); await pending;
    assert.equal(h.merged(), 0); assert.equal(h.bottom(), 0);
});
test('media finalization awaits an already pending realtime reconciliation without a duplicate fetch', async () => {
    const h = harness();
    const existing = h.api.reconcile(M, C);
    const pending = h.api.finalized({ messageId: M, conversationId: C });
    await settle(); assert.equal(h.bottom(), 0); assert.equal(h.fetches(), 1);
    h.fetch.resolve(message); await existing; await pending;
    assert.equal(h.merged(), 1); assert.equal(h.bottom(), 1);
});
