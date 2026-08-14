'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    formatAppointmentDate,
    getTodayDateKey,
    normalizeAppointment,
    partitionAppointments,
    sortAppointmentsChronologically,
} = require('../appointmentContract.cjs');

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const DIETITIAN_ID = '22222222-2222-4222-8222-222222222222';

const appointment = (overrides = {}) => ({
    id: '33333333-3333-4333-8333-333333333333',
    client_id: CLIENT_ID,
    dietitian_id: DIETITIAN_ID,
    title: '  Haftalık kontrol  ',
    date: '2026-08-13',
    time: '09:30:00',
    duration: 45,
    type: 'online',
    status: 'upcoming',
    ...overrides,
});

test('appointment rows normalize only canonical owned data', () => {
    assert.deepEqual(normalizeAppointment(appointment(), CLIENT_ID), {
        id: '33333333-3333-4333-8333-333333333333',
        clientId: CLIENT_ID,
        dietitianId: DIETITIAN_ID,
        title: 'Haftalık kontrol',
        date: '2026-08-13',
        time: '09:30',
        duration: 45,
        type: 'Görüntülü Görüşme',
        status: 'upcoming',
    });
});

test('malformed or cross-client appointment rows fail closed', () => {
    assert.throws(() => normalizeAppointment(appointment({ client_id: '44444444-4444-4444-8444-444444444444' }), CLIENT_ID));
    assert.throws(() => normalizeAppointment(appointment({ status: 'unknown' }), CLIENT_ID));
    assert.throws(() => normalizeAppointment(appointment({ date: '2026-02-30' }), CLIENT_ID));
});

test('appointment sections use actual status and deterministic Istanbul civil-date ordering', () => {
    const first = appointment({ id: 'a', date: '2026-08-13', time: '09:30', status: 'upcoming' });
    const second = appointment({ id: 'b', date: '2026-08-14', time: '09:00', status: 'upcoming' });
    const completed = appointment({ id: 'c', date: '2026-08-12', time: '17:00', status: 'completed' });
    const cancelled = appointment({ id: 'd', date: '2026-08-13', time: '18:00', status: 'cancelled' });

    const sections = partitionAppointments([completed, second, cancelled, first]);
    assert.deepEqual(sections.upcoming.map((item) => item.id), ['a', 'b']);
    assert.deepEqual(sections.past.map((item) => item.id), ['d', 'c']);
    assert.deepEqual(sortAppointmentsChronologically([second, first]).map((item) => item.id), ['a', 'b']);
});

test('date labels never reinterpret an appointment date as a device instant', () => {
    assert.equal(formatAppointmentDate('2026-08-13'), '13 Ağustos 2026');
    assert.equal(getTodayDateKey(new Date('2026-08-13T20:59:59.000Z')), '2026-08-13');
    assert.equal(getTodayDateKey(new Date('2026-08-13T21:00:00.000Z')), '2026-08-14');
});
