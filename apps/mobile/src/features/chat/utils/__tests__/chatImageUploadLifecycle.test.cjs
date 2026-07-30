'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const reducer = require('../chatImageUploadReducer');
const resources = require('../chatImageUploadResources');

const ids = {
    conversation: '11111111-1111-4111-8111-111111111111',
    clientMessageA: '22222222-2222-4222-8222-222222222222',
    clientMessageB: '33333333-3333-4333-8333-333333333333',
    intentA: '44444444-4444-4444-8444-444444444444',
    intentB: '55555555-5555-4555-8555-555555555555',
};

const canonical = (marker) => ({ uri: `file:///${marker}.jpg`, byteSize: 100, quality: 0.82, width: 100, height: 100, mimeType: 'image/jpeg' });

const intent = (id, clientMessageId) => ({
    id,
    conversationId: ids.conversation,
    createdBy: '66666666-6666-4666-8666-666666666666',
    clientMessageId,
    bucketId: 'chat-images',
    objectPath: `pending/${id}/${id}.jpg`,
    expectedMime: 'image/jpeg',
    maxBytes: 4194304,
    status: 'pending',
    expiresAt: new Date(Date.now() + 600000).toISOString(),
});

const uploadIntent = intent(ids.intentA, ids.clientMessageA);
const sourceSummary = { name: 'olcum.jpg', mimeType: 'image/png', byteSize: 900000 };
const selectAction = (operationId = 1) => ({
    type: 'select',
    operationId,
    conversationId: ids.conversation,
    clientMessageId: ids.clientMessageA,
    source: sourceSummary,
    previewUri: 'file:///preview.jpg',
});

// --- reducer state machine ------------------------------------------------

test('the happy path walks idle to succeeded through every stage', () => {
    let state = reducer.initialChatImageUploadState;
    assert.equal(state.status, 'idle');

    state = reducer.chatImageUploadReducer(state, selectAction(1));
    assert.equal(state.status, 'selected', 'local selection must not start network work');
    assert.equal(state.clientMessageId, ids.clientMessageA);
    assert.equal(state.previewUri, 'file:///preview.jpg');

    state = reducer.chatImageUploadReducer(state, { type: 'start', operationId: 1 });
    assert.equal(state.status, 'canonicalizing');
    state = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    assert.equal(state.status, 'creating-intent');
    state = reducer.chatImageUploadReducer(state, { type: 'intent-created', operationId: 1, intent: uploadIntent });
    assert.equal(state.status, 'uploading');
    state = reducer.chatImageUploadReducer(state, { type: 'progress', operationId: 1, progress: 0.5 });
    assert.equal(state.progress, 0.5);
    state = reducer.chatImageUploadReducer(state, { type: 'uploaded', operationId: 1 });
    assert.equal(state.status, 'validating');
    assert.equal(state.progress, null);
    state = reducer.chatImageUploadReducer(state, { type: 'validated', operationId: 1 });
    assert.equal(state.status, 'finalizing');
    state = reducer.chatImageUploadReducer(state, { type: 'finalized', operationId: 1 });
    assert.equal(state.status, 'succeeded');
    assert.equal(state.previewUri, null);
    assert.equal(state.source, null);
});

test('fake progress is never invented; out-of-range progress is ignored', () => {
    let state = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    state = reducer.chatImageUploadReducer(state, { type: 'start', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    state = reducer.chatImageUploadReducer(state, { type: 'intent-created', operationId: 1, intent: uploadIntent });
    assert.equal(state.progress, null, 'indeterminate until the transport reports progress');
    for (const bad of [-0.1, 1.1, Number.NaN, 'x']) {
        assert.equal(reducer.chatImageUploadReducer(state, { type: 'progress', operationId: 1, progress: bad }).progress, null);
    }
});

test('stale and out-of-order async results are ignored', () => {
    let state = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    state = reducer.chatImageUploadReducer(state, selectAction(2));
    assert.equal(state.operationId, 2);
    const stale = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    assert.equal(stale, state, 'a result from operation 1 must not mutate operation 2');
    assert.equal(reducer.chatImageUploadReducer(state, { type: 'uploaded', operationId: 2 }), state);
});

test('cancellation clears all UI resources and rejects late results', () => {
    const selected = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    let uploading = reducer.chatImageUploadReducer(selected, { type: 'start', operationId: 1 });
    uploading = reducer.chatImageUploadReducer(uploading, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    uploading = reducer.chatImageUploadReducer(uploading, { type: 'intent-created', operationId: 1, intent: uploadIntent });

    const cancelled = reducer.chatImageUploadReducer(uploading, { type: 'cancelled', operationId: 1 });
    assert.equal(cancelled.status, 'cancelled');
    assert.equal(cancelled.operationId, 1);
    for (const field of ['conversationId', 'clientMessageId', 'source', 'previewUri', 'canonical', 'intent', 'progress', 'error', 'retryStage']) {
        assert.equal(cancelled[field], null, `${field} must be cleared on cancellation`);
    }

    for (const action of [
        { type: 'canonicalized', operationId: 1, canonical: canonical('a') },
        { type: 'intent-created', operationId: 1, intent: uploadIntent },
        { type: 'uploaded', operationId: 1 },
        { type: 'finalized', operationId: 1 },
    ]) {
        assert.equal(reducer.chatImageUploadReducer(cancelled, action), cancelled, `${action.type} must not revive a cancelled operation`);
    }
});

test('a succeeded upload is never rolled back into cancelled', () => {
    let state = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    state = reducer.chatImageUploadReducer(state, { type: 'start', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    state = reducer.chatImageUploadReducer(state, { type: 'intent-created', operationId: 1, intent: uploadIntent });
    state = reducer.chatImageUploadReducer(state, { type: 'uploaded', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'validated', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'finalized', operationId: 1 });
    assert.equal(reducer.chatImageUploadReducer(state, { type: 'cancelled', operationId: 1 }), state);
});

test('a new selection supersedes the previous operation id and clears its resources', () => {
    let state = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    state = reducer.chatImageUploadReducer(state, { type: 'start', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    state = reducer.chatImageUploadReducer(state, { type: 'intent-created', operationId: 1, intent: uploadIntent });

    const replaced = reducer.chatImageUploadReducer(state, selectAction(2));
    assert.equal(replaced.operationId, 2);
    assert.equal(replaced.status, 'selected');
    assert.equal(replaced.intent, null, 'the previous intent must not leak into the new operation');
    assert.equal(replaced.canonical, null);
    assert.equal(reducer.chatImageUploadReducer(replaced, selectAction(1)), replaced, 'a lower operation id cannot supersede');
});

test('a retry resumes the same stage and keeps the idempotency key and intent', () => {
    let state = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    state = reducer.chatImageUploadReducer(state, { type: 'start', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    state = reducer.chatImageUploadReducer(state, { type: 'intent-created', operationId: 1, intent: uploadIntent });

    const retryStage = reducer.resolveRetryStage(state, 'uploading', true);
    assert.equal(retryStage, 'uploading');
    state = reducer.chatImageUploadReducer(state, { type: 'failed', operationId: 1, error: { code: 'storage_upload_failed', userMessage: 'x', retryable: true }, retryStage });
    assert.equal(state.status, 'failed');

    const resumed = reducer.chatImageUploadReducer(state, { type: 'retry', operationId: 1, stage: 'uploading' });
    assert.equal(resumed.status, 'uploading');
    assert.equal(resumed.error, null);
    assert.equal(resumed.clientMessageId, ids.clientMessageA, 'the idempotency key survives a retry');
    assert.equal(resumed.intent.id, ids.intentA, 'the same intent is reused');
});

test('resolveRetryStage never resumes past resources that do not exist', () => {
    const base = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    assert.equal(reducer.resolveRetryStage(base, 'uploading', false), null, 'non-retryable never resumes');
    assert.equal(reducer.resolveRetryStage(base, 'creating-intent', true), null, 'no canonical yet');
    assert.equal(reducer.resolveRetryStage(base, 'canonicalizing', true), 'canonicalizing');
    const withCanonical = { ...base, canonical: canonical('a') };
    assert.equal(reducer.resolveRetryStage(withCanonical, 'uploading', true), null, 'no intent yet');
    assert.equal(reducer.resolveRetryStage(withCanonical, 'creating-intent', true), 'creating-intent');
});

test('finalize retry does not duplicate: a finalized failure resumes at finalizing with the same intent', () => {
    let state = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    state = reducer.chatImageUploadReducer(state, { type: 'start', operationId: 1 });
    state = reducer.chatImageUploadReducer(state, { type: 'canonicalized', operationId: 1, canonical: canonical('a') });
    state = reducer.chatImageUploadReducer(state, { type: 'intent-created', operationId: 1, intent: uploadIntent });
    state = reducer.chatImageUploadReducer(state, { type: 'uploaded', operationId: 1 });
    const retryStage = reducer.resolveRetryStage(state, 'finalizing', true);
    assert.equal(retryStage, 'finalizing');
    state = reducer.chatImageUploadReducer(state, { type: 'failed', operationId: 1, error: { code: 'network', userMessage: 'x', retryable: true }, retryStage });
    const resumed = reducer.chatImageUploadReducer(state, { type: 'retry', operationId: 1, stage: 'finalizing' });
    assert.equal(resumed.status, 'finalizing');
    assert.equal(resumed.intent.id, ids.intentA);
    assert.equal(resumed.clientMessageId, ids.clientMessageA);
});

// --- start guard ----------------------------------------------------------

test('the disabled feature flag stops the flow before any RPC or Storage call', () => {
    const decision = reducer.evaluateChatImageUploadStart({ featureEnabled: false, conversationId: ids.conversation, sourceMimeType: 'image/jpeg' });
    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'feature_unavailable');
});

test('a missing conversationId or unsupported type is rejected before the flow starts', () => {
    for (const conversationId of [null, undefined, '', 'not-a-uuid']) {
        const decision = reducer.evaluateChatImageUploadStart({ featureEnabled: true, conversationId, sourceMimeType: 'image/jpeg' });
        assert.equal(decision.allowed, false, String(conversationId));
        assert.equal(decision.reason, 'invalid_request');
    }
    assert.equal(reducer.evaluateChatImageUploadStart({ featureEnabled: true, conversationId: ids.conversation, sourceMimeType: 'image/heic' }).reason, 'unsupported_type');
    const allowed = reducer.evaluateChatImageUploadStart({ featureEnabled: true, conversationId: ids.conversation, sourceMimeType: 'image/webp' });
    assert.equal(allowed.allowed, true);
    assert.equal(allowed.conversationId, ids.conversation);
});

// --- operation resource ownership -----------------------------------------

const operation = (intentValue, canonicalValue, previewUri) => ({
    canonical: canonicalValue,
    intent: intentValue,
    previewUri,
    intentReleased: false,
    finalized: false,
});

test('stale A cleanup cannot abort B intent after A is cancelled', () => {
    const a = operation(intent(ids.intentA, ids.clientMessageA), canonical('A'), 'file:///A.jpg');
    const b = operation(null, canonical('B'), 'file:///B.jpg');
    assert.equal(resources.takeChatImageIntentForAbort(a), ids.intentA);
    b.intent = intent(ids.intentB, ids.clientMessageB);
    assert.equal(resources.takeChatImageIntentForAbort(a), null, 'A can only release its own intent once');
    assert.equal(b.intent.id, ids.intentB);
});

test('stale A cleanup cannot clear B canonical or preview', () => {
    const a = operation(intent(ids.intentA, ids.clientMessageA), canonical('A'), 'file:///A.jpg');
    const b = operation(intent(ids.intentB, ids.clientMessageB), canonical('B'), 'file:///B.jpg');
    resources.clearChatImageCanonical(a);
    assert.equal(a.canonical, null);
    assert.equal(b.canonical.uri, 'file:///B.jpg');
    assert.equal(resources.takeChatImagePreviewUri(a), 'file:///A.jpg');
    assert.equal(a.previewUri, null);
    assert.equal(b.previewUri, 'file:///B.jpg');
});

test('a finalized operation cannot be aborted by later cleanup', () => {
    const b = operation(intent(ids.intentB, ids.clientMessageB), canonical('B'), 'file:///B.jpg');
    resources.finalizeChatImageResources(b);
    assert.equal(resources.takeChatImageIntentForAbort(b), null);
    assert.equal(b.intent, null);
    assert.equal(b.canonical, null);
});

test('cancelling an operation consumes its intent only once', () => {
    const b = operation(intent(ids.intentB, ids.clientMessageB), canonical('B'), 'file:///B.jpg');
    assert.equal(resources.takeChatImageIntentForAbort(b), ids.intentB);
    assert.equal(resources.takeChatImageIntentForAbort(b), null);
});
