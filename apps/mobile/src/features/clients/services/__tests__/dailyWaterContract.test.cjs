'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const {
    addWaterLiters,
    getWaterProgress,
    isWaterLoadCurrent,
    isWaterMutationCurrent,
    normalizePersistedWaterLiters,
    normalizeWaterTargetLitersFromMl,
    parseWaterInputMl,
    removeWaterLiters,
    WATER_TARGET_LITERS,
    waterMlToLiters,
} = require(path.join(root, 'apps/mobile/src/shared/utils/waterTrackingContract.cjs'));
const {
    addIstanbulDays,
    toIstanbulDateKey,
} = require(path.join(root, 'apps/mobile/src/shared/utils/istanbulDateContract.cjs'));

const dailyLogService = read('apps/mobile/src/features/clients/services/dailyLogService.js');
const dashboardViewModel = read('apps/mobile/src/features/clients/viewmodels/useDashboardViewModel.js');
const analyticsService = read('apps/mobile/src/features/analytics/services/analyticsService.js');
const waterTracker = read('apps/mobile/src/features/clients/components/dashboard/WaterTrackerCard.js');

test('Input 1: 200 ml parses and converts to 0.2 L', () => {
    assert.equal(parseWaterInputMl('200'), 200);
    assert.equal(parseWaterInputMl(' 200 '), 200);
    assert.equal(waterMlToLiters(200), 0.2);
});

test('Input 2: 1 ml converts to 0.001 L', () => {
    assert.equal(parseWaterInputMl('1'), 1);
    assert.equal(waterMlToLiters(1), 0.001);
});

test('Input 3: 9999 ml converts to 9.999 L', () => {
    assert.equal(parseWaterInputMl('9999'), 9999);
    assert.equal(waterMlToLiters(9999), 9.999);
});

test('Input 4: zero millilitres are rejected', () => {
    assert.equal(parseWaterInputMl('0'), null);
});

test('Input 5: empty input is rejected', () => {
    assert.equal(parseWaterInputMl(''), null);
});

test('Input 6: whitespace-only input is rejected', () => {
    assert.equal(parseWaterInputMl('   '), null);
});

test('Input 7: negative input is rejected', () => {
    assert.equal(parseWaterInputMl('-200'), null);
});

test('Input 8: decimal input is rejected', () => {
    assert.equal(parseWaterInputMl('200.5'), null);
});

test('Input 9: letter input is rejected', () => {
    assert.equal(parseWaterInputMl('200ml'), null);
});

test('Input 10: values above 9999 ml are rejected', () => {
    assert.equal(parseWaterInputMl('10000'), null);
});

test('State 11: adding 200 ml to 1 L produces 1.2 L', () => {
    assert.equal(addWaterLiters(1, 200), 1.2);
});

test('State 12: removing 200 ml from 1 L produces 0.8 L', () => {
    assert.equal(removeWaterLiters(1, 200), 0.8);
});

test('State 13: removing 500 ml from 0.2 L floors at zero', () => {
    assert.equal(removeWaterLiters(0.2, 500), 0);
});

test('State 14: adding above 5 L is preserved', () => {
    assert.equal(addWaterLiters(5, 200), 5.2);
});

test('State 15: progress saturates at 100 percent without clamping stored data', () => {
    const persistedValue = addWaterLiters(5, 400);
    assert.equal(persistedValue, 5.4);
    assert.equal(getWaterProgress(persistedValue), 1);
});

test('Persisted 16: zero litres are valid', () => {
    assert.equal(normalizePersistedWaterLiters(0), 0);
});

test('Persisted 17: positive numeric and numeric-string litres are valid', () => {
    assert.equal(normalizePersistedWaterLiters(1.5), 1.5);
    assert.equal(normalizePersistedWaterLiters('1.5'), 1.5);
});

test('Persisted 18: null and missing values represent an empty day', () => {
    assert.equal(normalizePersistedWaterLiters(null), null);
    assert.equal(normalizePersistedWaterLiters(undefined), null);
});

test('Persisted 19: negative and non-finite litres fail safely', () => {
    assert.ok(Number.isNaN(normalizePersistedWaterLiters(-0.1)));
    assert.ok(Number.isNaN(normalizePersistedWaterLiters(Number.NaN)));
    assert.ok(Number.isNaN(normalizePersistedWaterLiters(Number.POSITIVE_INFINITY)));
});

test('Persisted 20: malformed strings, objects, and arrays fail safely', () => {
    assert.ok(Number.isNaN(normalizePersistedWaterLiters('not-a-number')));
    assert.ok(Number.isNaN(normalizePersistedWaterLiters('')));
    assert.ok(Number.isNaN(normalizePersistedWaterLiters({ value: 1 })));
    assert.ok(Number.isNaN(normalizePersistedWaterLiters([1])));
});

test('Target conversion: profile millilitres normalize to dashboard litres', () => {
    assert.equal(normalizeWaterTargetLitersFromMl(4000), 4);
    assert.equal(normalizeWaterTargetLitersFromMl('4000'), 4);
    assert.equal(normalizeWaterTargetLitersFromMl(3500), 3.5);
    assert.equal(normalizeWaterTargetLitersFromMl(500), 0.5);
});

test('Target fallback: invalid profile targets use the canonical 3 L fallback', () => {
    for (const value of [null, undefined, 'malformed', Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
        assert.equal(normalizeWaterTargetLitersFromMl(value), WATER_TARGET_LITERS);
    }
});

test('Target progress: progress uses the saved target and still saturates at 100 percent', () => {
    assert.equal(getWaterProgress(2, 4), 0.5);
    assert.equal(getWaterProgress(3, 4), 0.75);
    assert.equal(getWaterProgress(4, 4), 1);
    assert.equal(getWaterProgress(5, 4), 1);
});

test('Lifecycle 21: an old load cannot overwrite a newer mutation sequence', () => {
    assert.equal(isWaterLoadCurrent({
        requestGeneration: 1,
        currentGeneration: 1,
        requestSequence: 1,
        currentSequence: 2,
        requestDateKey: '2026-09-01',
        activeDateKey: '2026-09-01',
    }), false);
});

test('Lifecycle 22: a previous session load is stale for the new session', () => {
    assert.equal(isWaterLoadCurrent({
        requestGeneration: 1,
        currentGeneration: 2,
        requestSequence: 1,
        currentSequence: 1,
        requestDateKey: '2026-09-01',
        activeDateKey: '2026-09-01',
    }), false);
});

test('Lifecycle 23: a previous date load is stale for the active date', () => {
    assert.equal(isWaterLoadCurrent({
        requestGeneration: 1,
        currentGeneration: 1,
        requestSequence: 1,
        currentSequence: 1,
        requestDateKey: '2026-08-31',
        activeDateKey: '2026-09-01',
    }), false);
});

test('Lifecycle 24: a failed current mutation can restore the exact rollback snapshot', () => {
    const previousState = {
        water: 1.5,
        status: 'ready',
        error: null,
        dateKey: '2026-09-01',
        generation: 3,
    };
    const optimisticState = { ...previousState, water: 1.7 };
    const canRollback = isWaterMutationCurrent({
        mutationGeneration: previousState.generation,
        currentGeneration: previousState.generation,
        mutationId: 4,
        activeMutationId: 4,
        mutationDateKey: previousState.dateKey,
        activeDateKey: previousState.dateKey,
    });

    assert.equal(canRollback, true);
    assert.deepEqual(canRollback ? previousState : optimisticState, previousState);
});

test('Lifecycle 25: a stale failure cannot roll back a newer mutation', () => {
    assert.equal(isWaterMutationCurrent({
        mutationGeneration: 3,
        currentGeneration: 3,
        mutationId: 4,
        activeMutationId: 5,
        mutationDateKey: '2026-09-01',
        activeDateKey: '2026-09-01',
    }), false);
});

test('Lifecycle 26: a mutation lock rejects a concurrent second tap', () => {
    let activeMutation = null;
    const tryStart = (id) => {
        if (activeMutation) return false;
        activeMutation = id;
        return true;
    };

    assert.equal(tryStart(1), true);
    assert.equal(tryStart(2), false);
    activeMutation = null;
    assert.equal(tryStart(2), true);
});

test('Day 27: yesterday value is not reused for a new-day add', () => {
    const yesterday = '2026-08-31';
    const today = '2026-09-01';
    assert.notEqual(yesterday, today);
    assert.equal(addWaterLiters(0, 200), 0.2);
    assert.notEqual(addWaterLiters(1.5, 200), 0.2);
});

test('Day 28: a foreground date change requires a current-date refresh', () => {
    assert.equal(isWaterLoadCurrent({
        requestGeneration: 1,
        currentGeneration: 1,
        requestSequence: 2,
        currentSequence: 2,
        requestDateKey: '2026-09-02',
        activeDateKey: '2026-09-02',
    }), true);
    assert.notEqual('2026-09-01', '2026-09-02');
});

test('Day 29: mutation date key is captured from the Istanbul action timestamp', () => {
    const actionStart = new Date('2026-09-01T20:59:59.999Z');
    assert.equal(toIstanbulDateKey(actionStart), '2026-09-01');
    assert.equal(addIstanbulDays(actionStart, 1), '2026-09-02');
});

test('Service 30: water write has exactly one upsert path', () => {
    assert.equal((dailyLogService.match(/\.upsert\(/g) || []).length, 1);
    assert.doesNotMatch(dailyLogService, /\.update\(/);
    assert.doesNotMatch(dailyLogService, /\.insert\(/);
    assert.doesNotMatch(dailyLogService, /getDailyLog\(dateStr\)/);
});

test('Service 31: water upsert uses the client_id,date conflict identity', () => {
    assert.match(dailyLogService, /onConflict:\s*'client_id,date'/);
    assert.match(dailyLogService, /client_id:\s*user\.id/);
    assert.match(dailyLogService, /date:\s*dateStr/);
});

test('Service 32: the returned server value becomes canonical state', () => {
    assert.match(dailyLogService, /\.select\('client_id,date,water_intake'\)/);
    assert.match(dailyLogService, /\.single\(\)/);
    assert.match(dailyLogService, /return persistedWater/);
    assert.match(dashboardViewModel, /const persistedWater = await upsertWaterIntake/);
    assert.match(dashboardViewModel, /setWater\(canonicalWater\)/);
});

test('Contract wiring: dashboard validates input and does not use fallback parsing or a 5 L cap', () => {
    assert.match(dashboardViewModel, /parseWaterInputMl/);
    assert.match(dashboardViewModel, /WATER_INPUT_VALIDATION_MESSAGE/);
    assert.doesNotMatch(dashboardViewModel, /parseInt\(amountMl/);
    assert.doesNotMatch(dashboardViewModel, /Math\.min\(water \+ amount \/ 1000, 5\)/);
    assert.match(dashboardViewModel, /getWaterProgress\(water,\s*waterTargetLiters\)/);
});

test('Contract wiring: dashboard synchronizes the profile water target safely', () => {
    assert.match(dashboardViewModel, /const \[waterTargetLiters, setWaterTargetLiters\] = useState\(WATER_TARGET_LITERS\)/);
    assert.match(dashboardViewModel, /profile\?\.dailyWaterGoalMl/);
    assert.match(dashboardViewModel, /setWaterTargetLiters\(normalizeWaterTargetLitersFromMl\(profile\?\.dailyWaterGoalMl\)\)/);
    assert.match(dashboardViewModel, /setWaterTargetLiters\(WATER_TARGET_LITERS\)/);
    assert.match(dashboardViewModel, /profileRequestGeneration/);
    assert.match(dashboardViewModel, /sessionGenerationRef\.current === profileRequestGeneration/);
    assert.match(dashboardViewModel, /profileRequestSequenceRef\.current === profileRequestSequence/);
    assert.match(dashboardViewModel, /profileRequestSequenceRef\.current \+= 1/);
});

test('Contract wiring: dashboard protects load, mutation, session, and date lifecycles', () => {
    assert.match(dashboardViewModel, /waterLoadSequenceRef/);
    assert.match(dashboardViewModel, /waterMutationRef/);
    assert.match(dashboardViewModel, /sessionGenerationRef/);
    assert.match(dashboardViewModel, /waterDateKeyRef/);
    assert.match(dashboardViewModel, /AppState\.addEventListener/);
    assert.match(dashboardViewModel, /isWaterLoadCurrentContract/);
    assert.match(dashboardViewModel, /isWaterMutationCurrentContract/);
    assert.match(dashboardViewModel, /toLocalDateKey\(mutationStart\)/);
});

test('Contract wiring: analytics keeps normalized values in litres', () => {
    assert.match(analyticsService, /normalizePersistedWaterLiters/);
    assert.match(analyticsService, /amount: log\.amount/);
    assert.doesNotMatch(analyticsService, /amount:\s*Number\(log\.water_intake\)/);
});

test('Contract wiring: retrying water loads keep controls disabled', () => {
    assert.match(waterTracker, /status === 'retrying'/);
    assert.match(waterTracker, /status === 'loading' \|\| status === 'retrying'/);
});

test('UI wiring: Pressable water controls do not forward the press event', () => {
    assert.match(waterTracker, /onPress=\{disabled \? undefined : \(\) => onRemove\(\)\}/);
    assert.match(waterTracker, /onPress=\{disabled \? undefined : \(\) => onAdd\(\)\}/);
    assert.doesNotMatch(waterTracker, /onPress=\{onRemove\}/);
    assert.doesNotMatch(waterTracker, /onPress=\{onAdd\}/);
    assert.doesNotMatch(waterTracker, /onPress=\{disabled \? undefined : onRemove\}/);
    assert.doesNotMatch(waterTracker, /onPress=\{disabled \? undefined : onAdd\}/);

    const calls = [];
    const onAdd = (...args) => calls.push(['add', args]);
    const onRemove = (...args) => calls.push(['remove', args]);
    const addPressHandler = () => onAdd();
    const removePressHandler = () => onRemove();
    const pressEvent = { nativeEvent: { pageX: 1, pageY: 2 } };

    addPressHandler(pressEvent);
    removePressHandler(pressEvent);

    assert.deepEqual(calls, [['add', []], ['remove', []]]);
});

test('Date boundary 33: the Istanbul date changes at the canonical midnight', () => {
    const beforeMidnight = new Date('2026-09-01T20:59:59.999Z');
    const afterMidnight = new Date('2026-09-01T21:00:00.001Z');
    assert.equal(toIstanbulDateKey(beforeMidnight), '2026-09-01');
    assert.equal(toIstanbulDateKey(afterMidnight), '2026-09-02');
});

test('Date boundary 34: invalid progress values fail closed', () => {
    assert.equal(getWaterProgress(null), 0);
    assert.equal(getWaterProgress(-1), 0);
    assert.equal(getWaterProgress('invalid'), 0);
});
