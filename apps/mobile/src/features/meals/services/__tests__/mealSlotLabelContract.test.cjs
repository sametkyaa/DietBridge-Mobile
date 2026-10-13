'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

const read = (...parts) => fs.readFileSync(path.join(__dirname, ...parts), 'utf8');
const service = read('..', 'mealService.js');
const readModel = read('..', 'mealReadModel.js');
const mealType = read('..', '..', '..', '..', 'shared', 'utils', 'mealType.js');

const scope = { clientId: 'client-a', dietitianId: 'dietitian-a', planDate: '2026-10-12' };
const loadService = (responses) => {
    const calls = [];
    const context = {
        MealPlanReadErrorCode: { FETCH: 'fetch', CONTRACT: 'contract' },
        MealPlanReadError: class extends Error {
            constructor(code, message) { super(message); this.code = code; }
        },
        supabase: { from: (table) => {
            const call = { table, columns: null, filters: [] };
            calls.push(call);
            const query = {
                select: (columns) => { call.columns = columns; return query; },
                eq: (key, value) => { call.filters.push([key, value]); return query; },
                then: (resolve, reject) => Promise.resolve(responses.shift()).then(resolve, reject),
            };
            return query;
        } },
    };
    vm.createContext(context);
    vm.runInContext(service.replace(/^import[\s\S]*?;\s*/gm, '').replace(/^export /gm, '')
        + '\nglobalThis.readPlan = getSingleDailyPlan;', context);
    return { calls, readPlan: context.readPlan };
};

test('custom slot names use the scoped query without a retry on a compatible backend', async () => {
    const row = { id: 'plan-a', meals: [{ slot_label: 'Gece Öğünü' }] };
    const { calls, readPlan } = loadService([{ data: [row], error: null }]);
    assert.equal(await readPlan(scope), row);
    assert.equal(calls.length, 1);
    assert.match(calls[0].columns, /slot_label/);
    assert.deepEqual(calls[0].filters, [['client_id', scope.clientId], ['dietitian_id', scope.dietitianId], ['plan_date', scope.planDate]]);
});

test('a missing slot column retries once and preserves ownership/date filters', async () => {
    for (const code of ['42703', 'PGRST204']) {
        const row = { id: 'legacy-plan' };
        const { calls, readPlan } = loadService([
            { data: null, error: { code, message: 'column meals_1.slot_label does not exist' } },
            { data: [row], error: null },
            { data: [row], error: null },
        ]);
        assert.equal(await readPlan(scope), row);
        assert.equal(await readPlan(scope), row);
        assert.equal(calls.length, 3);
        assert.match(calls[0].columns, /slot_label/);
        assert.doesNotMatch(calls[1].columns, /slot_label/);
        assert.doesNotMatch(calls[2].columns, /slot_label/);
        assert.deepEqual(calls[1].filters, calls[0].filters);
    }
});

test('permission, network, other-column and relationship errors are not treated as missing slot columns', async () => {
    for (const error of [
        { code: '42501', message: 'permission denied for slot_label' },
        { code: '42703', message: 'column meals_1.macros does not exist' },
        { code: 'PGRST200', message: 'relationship slot_label not found' },
        { message: 'Failed to fetch slot_label' },
    ]) {
        const { calls, readPlan } = loadService([{ data: null, error }]);
        await assert.rejects(readPlan(scope), (failure) => failure.code === 'fetch');
        assert.equal(calls.length, 1);
    }
});

test('a failed legacy retry reports failure rather than a successful empty plan', async () => {
    const { readPlan } = loadService([
        { data: null, error: { code: '42703', message: 'column slot_label does not exist' } },
        { data: null, error: { code: '42501', message: 'permission denied' } },
    ]);
    await assert.rejects(readPlan(scope), (failure) => failure.code === 'fetch');
});

test('slot labels survive normalization and invalid labels preserve the original meal type', () => {
    const context = { require: createRequire(path.join(__dirname, '..', 'mealReadModel.js')) };
    vm.createContext(context);
    vm.runInContext(readModel.replace(/^export /gm, '') + mealType.replace(/^export /gm, '')
        + '\nglobalThis.model = { normalizeCanonicalMeal, formatMealSlotName };', context);
    const meal = { id: 'meal-a', plan_id: 'plan-a', type: 'snack', title: 'Yoğurt', calories: null,
        macros: null, time: '21:00:00', sort_order: 0, photo_url: null,
        completion_photo_url: null, source: 'manual', recipe_id: null, description: null, is_eaten: false };
    for (const label of [undefined, null, '', '   ', 123, 'x'.repeat(41)]) {
        const normalized = context.model.normalizeCanonicalMeal({ ...meal, slot_label: label }, { id: 'plan-a' });
        assert.equal(normalized.slotLabel, null);
        assert.equal(context.model.formatMealSlotName(normalized), 'Ara Öğün');
    }
    const normalized = context.model.normalizeCanonicalMeal({ ...meal, slot_label: '  Gece Öğünü  ' }, { id: 'plan-a' });
    assert.equal(normalized.slotLabel, 'Gece Öğünü');
    assert.equal(context.model.formatMealSlotName(normalized), 'Gece Öğünü');
    assert.equal(normalized.type, 'snack');
});

test('meal displays prefer the slot name and fall back to the meal type', () => {
    assert.match(mealType, /export const formatMealSlotName/);
    assert.match(mealType, /return formatMealType\(meal\?\.type\)/);
    for (const relativePath of [
        ['..', '..', 'components', 'plan', 'MealPlanItem.js'],
        ['..', '..', 'components', 'MealDetailSheet.js'],
        ['..', '..', '..', 'clients', 'components', 'dashboard', 'TodayMealsCard.js'],
        ['..', '..', '..', 'clients', 'components', 'dashboard', 'NextMealCard.js'],
    ]) {
        const source = read(...relativePath);
        assert.match(source, /formatMealSlotName\(meal\)/);
        assert.doesNotMatch(source, /formatMealType\(meal\.type\)/);
    }
});
