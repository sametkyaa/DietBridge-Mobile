'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    hasMealSessionChanged,
    normalizeSessionUserId,
} = require('../../context/mealSessionIsolation.cjs');

test('meal session state changes when Auth moves between users or signed-out state', () => {
    assert.equal(hasMealSessionChanged('client-a', 'client-b'), true);
    assert.equal(hasMealSessionChanged('client-a', null), true);
    assert.equal(hasMealSessionChanged(null, 'client-a'), true);
    assert.equal(hasMealSessionChanged('client-a', 'client-a'), false);
});

test('blank session identifiers normalize to signed-out state', () => {
    assert.equal(normalizeSessionUserId(undefined), null);
    assert.equal(normalizeSessionUserId('  '), null);
    assert.equal(normalizeSessionUserId('client-a'), 'client-a');
});
