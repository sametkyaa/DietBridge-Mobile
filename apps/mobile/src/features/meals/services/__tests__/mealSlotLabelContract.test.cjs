'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (...parts) => fs.readFileSync(path.join(__dirname, ...parts), 'utf8');
const service = read('..', 'mealService.js');
const readModel = read('..', 'mealReadModel.js');
const mealType = read('..', '..', '..', '..', 'shared', 'utils', 'mealType.js');

test('slot_label is read with a legacy fallback for backends without the column', () => {
    assert.match(service, /PLAN_SELECT_COLUMNS_WITH_SLOT_LABEL = `[^`]*meals \(\$\{MEAL_SELECT_COLUMNS\}, slot_label\)`/);
    assert.match(service, /isMissingSlotLabelColumnError\(error\)/);
    assert.match(service, /slotLabelColumnAvailable = false;\s*\(\{ data, error \} = await queryDailyPlan\(PLAN_SELECT_COLUMNS, scope\)\)/);
    assert.match(service, /error\.code === '42703'/);
    assert.match(service, /\/slot_label\/\.test/);
});

test('slot_label is display-only and never fails the plan contract', () => {
    assert.match(readModel, /slotLabel: normalizeSlotLabel\(meal\.slot_label\)/);
    assert.match(readModel, /trimmed && trimmed\.length <= 40 \? trimmed : null/);
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
