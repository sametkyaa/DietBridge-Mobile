'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    classifyAppointment,
    formatAppointmentDate,
    getAppointmentBadgeStatus,
    getAppointmentStatusLabel,
    getTodayDateKey,
    normalizeAppointment,
    partitionAppointments,
    sortAppointmentsChronologically,
} = require('../appointmentContract.cjs');

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const DIETITIAN_ID = '22222222-2222-4222-8222-222222222222';
const ISTANBUL_15_00 = new Date('2026-08-14T12:00:00.000Z');

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

test('future upcoming appointment stays in Yaklaşan', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-15', time: '09:00' }),
        ISTANBUL_15_00,
    );
    assert.equal(result.tab, 'upcoming');
    assert.equal(result.displayStatus, 'upcoming');
});

test('yesterday stale upcoming appointment moves to Geçmiş', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-13', time: '18:00' }),
        ISTANBUL_15_00,
    );
    assert.equal(result.tab, 'past');
    assert.equal(result.displayStatus, 'past');
    assert.equal(getAppointmentStatusLabel(result.displayStatus), 'Geçmiş');
});

test('today earlier upcoming appointment moves to Geçmiş', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-14', time: '14:59', duration: null }),
        new Date('2026-08-14T12:00:01.000Z'),
    );
    assert.equal(result.tab, 'past');
    assert.equal(result.displayStatus, 'past');
});

test('today later upcoming appointment stays in Yaklaşan', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-14', time: '15:01' }),
        ISTANBUL_15_00,
    );
    assert.equal(result.tab, 'upcoming');
    assert.equal(result.displayStatus, 'upcoming');
});

test('completed future-dated appointment is always Geçmiş', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-20', time: '10:00', status: 'completed' }),
        ISTANBUL_15_00,
    );
    assert.equal(result.tab, 'past');
    assert.equal(result.displayStatus, 'completed');
});

test('cancelled appointment is always Geçmiş', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-20', time: '10:00', status: 'cancelled' }),
        ISTANBUL_15_00,
    );
    assert.equal(result.tab, 'past');
    assert.equal(result.displayStatus, 'cancelled');
});

test('ongoing appointment remains Yaklaşan with Devam ediyor display status', () => {
    const result = classifyAppointment(
        appointment({ date: '2026-08-14', time: '14:30', duration: 60 }),
        ISTANBUL_15_00,
    );
    assert.equal(result.tab, 'upcoming');
    assert.equal(result.displayStatus, 'in_progress');
    assert.equal(getAppointmentStatusLabel(result.displayStatus), 'Devam ediyor');
    assert.equal(getAppointmentBadgeStatus(result.displayStatus), 'info');
});

test('appointment classification follows Istanbul midnight boundary', () => {
    const appointmentAtMidnight = appointment({ date: '2026-08-14', time: '00:00', duration: null });
    const beforeMidnight = classifyAppointment(
        appointmentAtMidnight,
        new Date('2026-08-13T20:59:59.000Z'),
    );
    const atMidnight = classifyAppointment(
        appointmentAtMidnight,
        new Date('2026-08-13T21:00:00.000Z'),
    );
    assert.equal(beforeMidnight.tab, 'upcoming');
    assert.equal(atMidnight.tab, 'past');
});

test('UTC conversion does not shift the Istanbul appointment date', () => {
    const localMorning = classifyAppointment(
        appointment({ date: '2026-08-14', time: '00:30', duration: null }),
        new Date('2026-08-13T21:00:00.000Z'),
    );
    assert.equal(localMorning.tab, 'upcoming');
    assert.equal(formatAppointmentDate('2026-08-14'), '14 Ağustos 2026');
});

test('past appointments sort newest first and upcoming appointments nearest first', () => {
    const sections = partitionAppointments([
        appointment({ id: 'old', date: '2026-08-13', time: '18:00' }),
        appointment({ id: 'new', date: '2026-08-14', time: '14:59', duration: null }),
        appointment({ id: 'near', date: '2026-08-14', time: '15:01' }),
        appointment({ id: 'far', date: '2026-08-15', time: '09:00' }),
    ], new Date('2026-08-14T12:00:01.000Z'));
    assert.deepEqual(sections.past.map((item) => item.id), ['new', 'old']);
    assert.deepEqual(sections.upcoming.map((item) => item.id), ['near', 'far']);
    assert.deepEqual(sortAppointmentsChronologically(sections.upcoming).map((item) => item.id), ['near', 'far']);
});

test('Istanbul date key remains stable across the UTC boundary', () => {
    assert.equal(getTodayDateKey(new Date('2026-08-13T20:59:59.000Z')), '2026-08-13');
    assert.equal(getTodayDateKey(new Date('2026-08-13T21:00:00.000Z')), '2026-08-14');
});
