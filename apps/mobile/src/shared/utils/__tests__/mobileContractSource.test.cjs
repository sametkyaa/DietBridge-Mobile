'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (relativePath) => fs.readFileSync(
    path.join(__dirname, '..', '..', '..', relativePath),
    'utf8',
);

test('mobile measurement writes remain client-owned and scoped to the authenticated user', () => {
    const source = read('features/analytics/services/analyticsService.js');
    assert.match(source, /getActiveDietitianConnection\(user\.id\)/);
    assert.match(source, /\.eq\('client_id', user\.id\)/);
    assert.match(source, /client_id: user\.id/);
});

test('mobile client measurement writes use Istanbul civil-date helper', () => {
    const source = read('features/clients/services/clientService.js');
    assert.match(source, /toLocalDateKey\(\)/);
    const localDate = read('shared/utils/localDate.js');
    assert.match(localDate, /toIstanbulDateKey/);
});
