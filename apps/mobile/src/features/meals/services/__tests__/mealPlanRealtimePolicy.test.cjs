'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    buildMealPlanChannelConfig,
    createRealtimeRefreshScheduler,
    isMealEventRelevant,
    isMealPlanEventRelevant,
} = require('../mealPlanRealtimePolicy');

const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

test('channel config is client-scoped and listens to both tables', () => {
    const config = buildMealPlanChannelConfig('client-123');

    assert.equal(config.channelName, 'client-meal-plan:client-123');

    const mealPlanSubs = config.subscriptions.filter((sub) => sub.table === 'meal_plans');
    const mealSubs = config.subscriptions.filter((sub) => sub.table === 'meals');

    assert.deepEqual(mealPlanSubs.map((sub) => sub.event).sort(), ['DELETE', 'INSERT', 'UPDATE']);
    assert.deepEqual(mealSubs.map((sub) => sub.event).sort(), ['DELETE', 'INSERT', 'UPDATE']);

    // meal_plans events are filtered server-side by client ownership.
    mealPlanSubs.forEach((sub) => assert.equal(sub.filter, 'client_id=eq.client-123'));
    // meals rows carry no client_id, so they must stay unfiltered server-side.
    mealSubs.forEach((sub) => assert.equal(sub.filter, null));
});

test('meal plan events are relevant only for the loaded plan date', () => {
    assert.equal(isMealPlanEventRelevant({ new: { plan_date: '2026-07-24' } }, '2026-07-24'), true);
    assert.equal(isMealPlanEventRelevant({ new: { plan_date: '2026-07-25' } }, '2026-07-24'), false);
    assert.equal(isMealPlanEventRelevant({ old: { plan_date: '2026-07-24' } }, '2026-07-24'), true);
});

test('meal plan events without plan_date fall back to a controlled refetch', () => {
    // DELETE with default replica identity carries only the primary key.
    assert.equal(isMealPlanEventRelevant({ old: { id: 'plan-1' } }, '2026-07-24'), true);
    assert.equal(isMealPlanEventRelevant({}, '2026-07-24'), true);
    assert.equal(isMealPlanEventRelevant(null, '2026-07-24'), true);
});

test('meal events are matched against loaded plan ids', () => {
    const knownPlanIds = new Set(['plan-a', 'plan-b']);

    assert.equal(isMealEventRelevant({ new: { plan_id: 'plan-a' } }, knownPlanIds), true);
    assert.equal(isMealEventRelevant({ old: { plan_id: 'plan-b' } }, knownPlanIds), true);
    assert.equal(isMealEventRelevant({ new: { plan_id: 'plan-other' } }, knownPlanIds), false);
    assert.equal(isMealEventRelevant({ new: { plan_id: 'plan-other' }, old: { plan_id: 'plan-a' } }, knownPlanIds), true);
});

test('meal events without plan_id fall back to a controlled refetch', () => {
    const knownPlanIds = new Set(['plan-a']);

    assert.equal(isMealEventRelevant({ old: { id: 'meal-1' } }, knownPlanIds), true);
    assert.equal(isMealEventRelevant({}, knownPlanIds), true);
    assert.equal(isMealEventRelevant(null, knownPlanIds), true);
});

test('rapid events collapse into a single debounced refresh', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });

    let calls = 0;
    const scheduler = createRealtimeRefreshScheduler({ delayMs: 350, onRefresh: () => { calls += 1; } });

    scheduler.notify();
    scheduler.notify();
    scheduler.notify();

    t.mock.timers.tick(349);
    assert.equal(calls, 0);

    t.mock.timers.tick(1);
    assert.equal(calls, 1);

    t.mock.timers.tick(1000);
    assert.equal(calls, 1);

    scheduler.dispose();
});

test('clearPending cancels a scheduled refresh and its timer', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });

    let calls = 0;
    const scheduler = createRealtimeRefreshScheduler({ delayMs: 100, onRefresh: () => { calls += 1; } });

    scheduler.notify();
    scheduler.clearPending();

    t.mock.timers.tick(1000);
    assert.equal(calls, 0);

    scheduler.dispose();
});

test('a refresh in flight schedules at most one trailing refresh', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });

    let calls = 0;
    let resolveCurrent = null;
    const scheduler = createRealtimeRefreshScheduler({
        delayMs: 100,
        onRefresh: () => {
            calls += 1;
            return new Promise((resolve) => { resolveCurrent = resolve; });
        },
    });

    scheduler.notify();
    t.mock.timers.tick(100);
    await flushMicrotasks();
    assert.equal(calls, 1);

    // Multiple events fire while the first refresh is still running.
    scheduler.notify();
    t.mock.timers.tick(100);
    scheduler.notify();
    t.mock.timers.tick(100);
    assert.equal(calls, 1);

    resolveCurrent();
    await flushMicrotasks();

    // Exactly one trailing refresh is scheduled after completion.
    t.mock.timers.tick(100);
    await flushMicrotasks();
    assert.equal(calls, 2);

    resolveCurrent();
    await flushMicrotasks();
    t.mock.timers.tick(1000);
    await flushMicrotasks();
    assert.equal(calls, 2);

    scheduler.dispose();
});

test('refresh errors are contained and later events still refresh', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });

    let calls = 0;
    const scheduler = createRealtimeRefreshScheduler({
        delayMs: 100,
        onRefresh: () => {
            calls += 1;
            if (calls === 1) return Promise.reject(new Error('network down'));
            return Promise.resolve();
        },
    });

    scheduler.notify();
    t.mock.timers.tick(100);
    await flushMicrotasks();
    assert.equal(calls, 1);

    scheduler.notify();
    t.mock.timers.tick(100);
    await flushMicrotasks();
    assert.equal(calls, 2);

    scheduler.dispose();
});

test('dispose permanently stops the scheduler', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });

    let calls = 0;
    const scheduler = createRealtimeRefreshScheduler({ delayMs: 100, onRefresh: () => { calls += 1; } });

    scheduler.notify();
    scheduler.dispose();
    scheduler.notify();

    t.mock.timers.tick(1000);
    assert.equal(calls, 0);
});

test('clearPending during an in-flight refresh drops the trailing refresh', async (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });

    let calls = 0;
    let resolveCurrent = null;
    const scheduler = createRealtimeRefreshScheduler({
        delayMs: 100,
        onRefresh: () => {
            calls += 1;
            return new Promise((resolve) => { resolveCurrent = resolve; });
        },
    });

    scheduler.notify();
    t.mock.timers.tick(100);
    await flushMicrotasks();
    assert.equal(calls, 1);

    scheduler.notify();
    t.mock.timers.tick(100);

    // Blur/unmount lands while the refresh is still running.
    scheduler.clearPending();
    resolveCurrent();
    await flushMicrotasks();
    t.mock.timers.tick(1000);
    await flushMicrotasks();

    assert.equal(calls, 1);

    scheduler.dispose();
});
