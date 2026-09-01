'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const sourceRoot = path.join(root, 'apps/mobile/src');
const analysisScreen = read('apps/mobile/src/features/analytics/screens/AnalysisScreen.js');
const analyticsViewModel = read('apps/mobile/src/features/analytics/viewmodels/useAnalyticsViewModel.js');
const analyticsService = read('apps/mobile/src/features/analytics/services/analyticsService.js');
const componentsIndex = read('apps/mobile/src/features/analytics/components/index.js');

const collectSourceFiles = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    return /\.(?:js|cjs)$/.test(entry.name) ? [fullPath] : [];
});

test('Badge 28: AnalysisScreen does not import or render BadgesCard', () => {
    assert.doesNotMatch(analysisScreen, /BadgesCard|\bbadges\b/i);
});

test('Badge 29: analytics ViewModel has no badge state or return value', () => {
    assert.doesNotMatch(analyticsViewModel, /BadgesCard|\bbadges\b|currentBadges|setBadges/i);
});

test('Badge 30: analytics overview has no placeholder badge fetch', () => {
    assert.doesNotMatch(analyticsService, /getBadges|\bbadges\b|currentBadges/i);
    assert.match(analyticsService, /return \{ weights, measurements, waterHistory \}/);
});

test('Badge 31: meaningful analytics data uses only real sources', () => {
    assert.match(analyticsViewModel, /weights\.length > 0[\s\S]*currentMeasurements\.length > 0[\s\S]*currentWaterHistory\.length > 0/);
    assert.doesNotMatch(analyticsViewModel, /badge/i);
});

test('Badge 32: BadgesCard has no active repository references', () => {
    assert.equal(fs.existsSync(path.join(root, 'apps/mobile/src/features/analytics/components/BadgesCard.js')), false);
    const references = collectSourceFiles(sourceRoot)
        .filter((file) => !file.endsWith('badgeRemovalContract.test.cjs'))
        .filter((file) => /BadgesCard|getBadges|currentBadges|\bbadges\b/i.test(fs.readFileSync(file, 'utf8')));
    assert.deepEqual(references, []);
});

test('Badge 33: real analytics cards and water normalization remain present', () => {
    for (const card of ['WeightProgressCard', 'BodyMeasurementsCard', 'WaterHistoryCard']) assert.match(analysisScreen, new RegExp(card));
    assert.match(analyticsService, /normalizePersistedWaterLiters/);
    assert.match(analyticsService, /waterHistory/);
    assert.match(componentsIndex, /BodyMeasurementsCard|WaterHistoryCard|WeightProgressCard/);
});
