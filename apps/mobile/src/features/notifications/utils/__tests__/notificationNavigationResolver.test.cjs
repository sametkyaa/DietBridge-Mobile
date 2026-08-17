'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { resolveNotificationDestinationWithDependencies } = require('../notificationNavigationResolver.cjs');

const RELATION_ID = '11111111-1111-4111-8111-111111111111';
const CONVERSATION_ID = '22222222-2222-4222-8222-222222222222';
const APPOINTMENT_ID = '33333333-3333-4333-8333-333333333333';
const RELATIONSHIP_ID = '44444444-4444-4444-8444-444444444444';

test('authorized Chat notification resolves only the current authorized conversation', async () => {
    const result = await resolveNotificationDestinationWithDependencies({
        notification: { category: 'chat_message', eventType: 'new_message', conversationId: CONVERSATION_ID },
        activeConnection: { id: RELATION_ID, status: 'active' },
        getChatConversationByRelationId: async ({ relationId }) => ({ id: CONVERSATION_ID, relationId }),
    });
    assert.deepEqual(result, { kind: 'chat', relationId: RELATION_ID, conversationId: CONVERSATION_ID });

    const inaccessible = await resolveNotificationDestinationWithDependencies({
        notification: { category: 'chat_message', eventType: 'new_message', conversationId: CONVERSATION_ID },
        activeConnection: { id: RELATION_ID, status: 'removed' },
        getChatConversationByRelationId: async () => ({ id: CONVERSATION_ID }),
    });
    assert.equal(inaccessible.kind, 'invalid');
});

test('appointment navigation fetches current appointment and never trusts the snapshot', async () => {
    const currentAppointment = { id: APPOINTMENT_ID, title: 'Güncel randevu' };
    const requestedIds = [];
    const result = await resolveNotificationDestinationWithDependencies({
        notification: {
            category: 'appointment',
            eventType: 'updated',
            appointmentId: APPOINTMENT_ID,
            appointmentTitleSnapshot: 'Eski snapshot',
        },
        fetchClientAppointmentById: async (id) => {
            requestedIds.push(id);
            return currentAppointment;
        },
    });
    assert.deepEqual(result, { kind: 'appointment', appointment: currentAppointment });
    assert.deepEqual(requestedIds, [APPOINTMENT_ID]);
    assert.notEqual(result.appointment.title, 'Eski snapshot');
});

test('reminder navigation fetches the current rescheduled appointment through the existing path', async () => {
    const currentAppointment = { id: APPOINTMENT_ID, title: 'Güncel randevu', time: '17:00:00' };
    let fetchedId = null;
    const result = await resolveNotificationDestinationWithDependencies({
        notification: {
            category: 'appointment',
            eventType: 'reminder_24h',
            appointmentId: APPOINTMENT_ID,
            appointmentTitleSnapshot: 'Eski 15:00 snapshot',
            appointmentTime: '15:00:00',
        },
        fetchClientAppointmentById: async (id) => {
            fetchedId = id;
            return currentAppointment;
        },
    });

    assert.deepEqual(result, { kind: 'appointment', appointment: currentAppointment });
    assert.equal(fetchedId, APPOINTMENT_ID);
    assert.equal(result.appointment.time, '17:00:00');
});

test('removed appointment notification does not attempt an RLS-protected detail fetch', async () => {
    let fetchCount = 0;
    const result = await resolveNotificationDestinationWithDependencies({
        notification: {
            category: 'appointment',
            eventType: 'removed_from_client',
            appointmentId: APPOINTMENT_ID,
        },
        fetchClientAppointmentById: async () => {
            fetchCount += 1;
            return null;
        },
    });
    assert.deepEqual(result, { kind: 'removedAppointment' });
    assert.equal(fetchCount, 0);
});

test('stale appointment and relationship targets fail or route safely', async () => {
    const staleAppointment = await resolveNotificationDestinationWithDependencies({
        notification: { category: 'appointment', eventType: 'created', appointmentId: APPOINTMENT_ID },
        fetchClientAppointmentById: async () => null,
    });
    assert.equal(staleAppointment.kind, 'invalid');

    const deletedReminder = await resolveNotificationDestinationWithDependencies({
        notification: { category: 'appointment', eventType: 'reminder_1h', appointmentId: APPOINTMENT_ID },
        fetchClientAppointmentById: async () => null,
    });
    assert.equal(deletedReminder.kind, 'invalid');

    const pending = await resolveNotificationDestinationWithDependencies({
        notification: { category: 'relationship', eventType: 'request_pending', dietitianClientId: RELATIONSHIP_ID },
        pendingRequest: { id: RELATIONSHIP_ID },
    });
    assert.deepEqual(pending, { kind: 'relationship', destination: 'home', actionable: true });

    const removed = await resolveNotificationDestinationWithDependencies({
        notification: { category: 'relationship', eventType: 'removed', dietitianClientId: RELATIONSHIP_ID },
    });
    assert.deepEqual(removed, { kind: 'relationship', destination: 'home', actionable: false });
});
