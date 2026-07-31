'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    CHAT_SCREEN_CONTENT,
    resolveChatScreenContent,
} = require('../chatScreenContent');
const reducer = require('../chatImageUploadReducer');

const activeConnection = {
    id: '11111111-1111-4111-8111-111111111111',
    status: 'active',
    clientId: '22222222-2222-4222-8222-222222222222',
};

const selectAction = (operationId = 1) => ({
    type: 'select',
    operationId,
    conversationId: '33333333-3333-4333-8333-333333333333',
    clientMessageId: '44444444-4444-4444-8444-444444444444',
    source: { name: 'olcum.png', mimeType: 'image/png', byteSize: 900000 },
    previewUri: 'file:///preview.jpg',
});

test('initial connection load owns the screen with a loader', () => {
    const content = resolveChatScreenContent({
        isLoadingConnection: true,
        connectionError: null,
        hasActiveDietitian: false,
        activeConnection: null,
    });
    assert.equal(content, CHAT_SCREEN_CONTENT.LOADING);
});

test('a background refresh keeps the chat mounted once a connection is active', () => {
    // This is the picker-return case: AppState -> active schedules a refresh
    // that flips isLoadingConnection true while the active connection is still
    // present. The chat must stay mounted so the image draft survives.
    const content = resolveChatScreenContent({
        isLoadingConnection: true,
        connectionError: null,
        hasActiveDietitian: true,
        activeConnection,
    });
    assert.equal(content, CHAT_SCREEN_CONTENT.ACTIVE);
});

test('a transient refresh error does not tear down an active chat', () => {
    const content = resolveChatScreenContent({
        isLoadingConnection: false,
        connectionError: 'gecici hata',
        hasActiveDietitian: true,
        activeConnection,
    });
    assert.equal(content, CHAT_SCREEN_CONTENT.ACTIVE);
});

test('an error with no active connection surfaces the error state', () => {
    const content = resolveChatScreenContent({
        isLoadingConnection: false,
        connectionError: 'gecici hata',
        hasActiveDietitian: false,
        activeConnection: null,
    });
    assert.equal(content, CHAT_SCREEN_CONTENT.ERROR);
});

test('no dietitian and no load resolves to the locked state', () => {
    const content = resolveChatScreenContent({
        isLoadingConnection: false,
        connectionError: null,
        hasActiveDietitian: false,
        activeConnection: null,
    });
    assert.equal(content, CHAT_SCREEN_CONTENT.LOCKED);
});

test('a partially-resolved connection (flag without object) is not treated as active', () => {
    assert.equal(
        resolveChatScreenContent({ isLoadingConnection: true, hasActiveDietitian: true, activeConnection: null }),
        CHAT_SCREEN_CONTENT.LOADING,
    );
    assert.equal(
        resolveChatScreenContent({ isLoadingConnection: false, hasActiveDietitian: false, activeConnection }),
        CHAT_SCREEN_CONTENT.LOCKED,
    );
});

test('an empty/undefined connection input fails closed to a loader-free locked state', () => {
    assert.equal(resolveChatScreenContent(), CHAT_SCREEN_CONTENT.LOCKED);
    assert.equal(resolveChatScreenContent({}), CHAT_SCREEN_CONTENT.LOCKED);
});

// The screen-mount guarantee only matters because the image draft lives in the
// chat subtree's reducer state. These assertions pin the reducer contract that
// a preserved mount actually keeps the selection intact across the incidental
// dispatches a background refresh can produce.
test('a selected image draft survives an unrelated reset-to-same-operation no-op', () => {
    const selected = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    assert.equal(selected.status, 'selected');
    assert.equal(selected.previewUri, 'file:///preview.jpg');

    // A stale, superseded select (older id) must not clear the live selection.
    const afterStale = reducer.chatImageUploadReducer(selected, selectAction(0));
    assert.equal(afterStale, selected);
    assert.equal(afterStale.previewUri, 'file:///preview.jpg');
    assert.equal(afterStale.clientMessageId, selected.clientMessageId);
});

test('a real second selection replaces the first while the screen stays mounted', () => {
    const first = reducer.chatImageUploadReducer(reducer.initialChatImageUploadState, selectAction(1));
    const second = reducer.chatImageUploadReducer(first, {
        ...selectAction(2),
        previewUri: 'file:///second.jpg',
    });
    assert.equal(second.operationId, 2);
    assert.equal(second.previewUri, 'file:///second.jpg');
    assert.equal(second.status, 'selected');
});
