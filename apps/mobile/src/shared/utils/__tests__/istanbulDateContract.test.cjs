'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    addIstanbulDays,
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
