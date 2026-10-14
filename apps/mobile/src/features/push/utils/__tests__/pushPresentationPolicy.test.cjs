'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { getForegroundPushBehavior } = require('../pushPresentationPolicy.cjs');
const userId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const conversationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const data = { notificationId: userId, version: 1, category: 'chat_message', conversationId };

test('foreground chat shows banner/list with sound on another screen', () => {
    assert.deepEqual(getForegroundPushBehavior({ data, userId }), {
        shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    });
});
test('same visible conversation keeps system list without duplicate banner/sound', () => {
    assert.deepEqual(getForegroundPushBehavior({ data, userId, visibleConversationId: conversationId }), {
        shouldShowBanner: false, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false,
    });
});
test('other conversations and appointments still alert', () => {
    assert.equal(getForegroundPushBehavior({ data, userId, visibleConversationId: userId }).shouldShowBanner, true);
    assert.equal(getForegroundPushBehavior({ data: { ...data, category: 'appointment' }, userId, visibleConversationId: conversationId }).shouldShowBanner, true);
});
test('logged out and malformed pushes do not appear in foreground', () => {
    for (const options of [{ data }, { data: {}, userId }, { data: { ...data, version: 2 }, userId }]) {
        const result = getForegroundPushBehavior(options);
        assert.equal(result.shouldShowBanner, false);
        assert.equal(result.shouldShowList, false);
    }
});
