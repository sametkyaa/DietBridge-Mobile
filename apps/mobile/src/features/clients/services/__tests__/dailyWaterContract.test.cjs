'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const normalizePersistedWaterLiters = (value) => (
    value === null || value === undefined || value === '' ? null : Number(value)
);

test('Mobile shared water vectors preserve persisted liters and nullable states', () => {
    for (const [raw, expected] of [
        [1, 1],
        [1.5, 1.5],
        [0, 0],
        [null, null],
        [undefined, null],
        ['', null],
    ]) {
        assert.equal(normalizePersistedWaterLiters(raw), expected);
    }
});

test('Mobile daily-log read/write paths use the canonical persisted water value directly', () => {
    const dailyLogService = read('apps/mobile/src/features/clients/services/dailyLogService.js');
    const dashboardViewModel = read('apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js');
    const analyticsService = read('apps/mobile/src/features/analytics/services/analyticsService.js');
    const waterTracker = read('apps/mobile/src/features/clients/components/dashboard/WaterTrackerCard.js');

    assert.match(dailyLogService, /update\(\{ water_intake: waterAmount \}\)/);
    assert.match(dailyLogService, /water_intake: waterAmount/);
    assert.doesNotMatch(dailyLogService, /water_intake[\s\S]{0,180}\/\s*1000/);
    assert.match(dashboardViewModel, /setWater\(log\.water_intake\)/);
    assert.match(dashboardViewModel, /water \+ amount \/ 1000/);
    assert.match(analyticsService, /amount: Number\(log\.water_intake\)/);
    assert.match(waterTracker, /water\.toFixed\(2\)/);
});
