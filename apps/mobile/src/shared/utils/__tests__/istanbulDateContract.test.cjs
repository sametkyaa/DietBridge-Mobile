'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    addIstanbulDays,
    civilDateFromInstant,
    getIstanbulWeekdayIndex,
    toIstanbulDateKey,
} = require('../istanbulDateContract.cjs');

test('Istanbul midnight boundary does not shift the civil date', () => {
    assert.equal(toIstanbulDateKey(new Date('2026-08-12T20:59:59.000Z')), '2026-08-12');
    assert.equal(toIstanbulDateKey(new Date('2026-08-12T21:00:00.000Z')), '2026-08-13');
});

test('Istanbul civil-day arithmetic is calendar based', () => {
    const instant = new Date('2026-01-01T21:00:00.000Z');
    assert.equal(addIstanbulDays(instant, -1), '2026-01-01');
    assert.equal(addIstanbulDays(instant, 1), '2026-01-03');
});

test('Istanbul weekday index is Monday-first for every required boundary day', () => {
    assert.equal(getIstanbulWeekdayIndex(new Date('2026-08-10T12:00:00.000Z')), 0);
    assert.equal(getIstanbulWeekdayIndex(new Date('2026-08-13T12:00:00.000Z')), 3);
    assert.equal(getIstanbulWeekdayIndex(new Date('2026-08-16T12:00:00.000Z')), 6);
});

test('Istanbul week boundary changes at local midnight without UTC drift', () => {
    const beforeMonday = civilDateFromInstant(new Date('2026-08-16T20:59:59.000Z'));
    const monday = civilDateFromInstant(new Date('2026-08-16T21:00:00.000Z'));

    assert.equal(beforeMonday.toISOString().slice(0, 10), '2026-08-16');
    assert.equal(monday.toISOString().slice(0, 10), '2026-08-17');
    assert.equal(getIstanbulWeekdayIndex(new Date('2026-08-16T20:59:59.000Z')), 6);
    assert.equal(getIstanbulWeekdayIndex(new Date('2026-08-16T21:00:00.000Z')), 0);
});

test('invalid date input remains an explicit contract error', () => {
    assert.throws(
        () => getIstanbulWeekdayIndex(new Date('invalid')),
        /Geçerli bir tarih bulunamadı\./,
    );
});
