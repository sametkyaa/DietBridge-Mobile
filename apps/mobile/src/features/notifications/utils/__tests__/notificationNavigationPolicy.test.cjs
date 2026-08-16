'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getNotificationNavigationIntent } = require('../notificationNavigationPolicy.cjs');

const UUID = '22222222-2222-4222-8222-222222222222';

test('Chat notification intent requires the canonical conversation id', () => {
    assert.deepEqual(
        getNotificationNavigationIntent({ category: 'chat_message', eventType: 'new_message', conversationId: UUID }),
        { kind: 'chat' },
    );
    assert.equal(getNotificationNavigationIntent({ category: 'chat_message', eventType: 'new_message' }).kind, 'invalid');
});

test('appointment intent separates current-detail and removed-from-client flows', () => {
    assert.deepEqual(
        getNotificationNavigationIntent({ category: 'appointment', eventType: 'updated', appointmentId: UUID }),
        { kind: 'appointment' },
    );
    assert.deepEqual(
        getNotificationNavigationIntent({ category: 'appointment', eventType: 'removed_from_client', appointmentId: UUID }),
        { kind: 'removedAppointment' },
    );
});

test('relationship intent requires the current relationship identifier', () => {
    assert.deepEqual(
        getNotificationNavigationIntent({ category: 'relationship', eventType: 'request_pending', dietitianClientId: UUID }),
        { kind: 'relationship', eventType: 'request_pending' },
    );
    assert.equal(getNotificationNavigationIntent({ category: 'relationship', eventType: 'removed' }).kind, 'invalid');
});

test('unsupported event or category fails safely', () => {
    assert.deepEqual(
        getNotificationNavigationIntent({ category: 'chat_message', eventType: 'message_body', conversationId: UUID }),
        { kind: 'invalid', message: 'Bu bildirim artık görüntülenemiyor.' },
    );
});
