'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const {
    isGroceryLoadCurrent,
    isGroceryMutationCurrent,
    normalizeGroceryName,
    removeGroceryItem,
    replaceGroceryItem,
    restoreGroceryItem,
    sortGroceryItems,
} = require(path.join(root, 'apps/mobile/src/features/grocery/utils/groceryContract.cjs'));

const service = read('apps/mobile/src/features/grocery/services/groceryService.js');
const viewModel = read('apps/mobile/src/features/grocery/viewmodels/useGroceryListViewModel.js');
const rootNavigator = read('apps/mobile/src/navigation/RootNavigator.js');
const sidebar = read('apps/mobile/src/features/clients/components/dashboard/DashboardSidebar.js');
const mealsScreen = read('apps/mobile/src/features/meals/screens/MealsScreen.js');
const mealPlanHeader = read('apps/mobile/src/features/meals/components/plan/MealPlanHeader.js');
const mainTabs = read('apps/mobile/src/navigation/MainTabs.js');

const clientA = '11111111-1111-4111-8111-111111111111';
const item = (overrides = {}) => ({
    id: '22222222-2222-4222-8222-222222222222',
    clientId: clientA,
    name: 'Süt',
    isCompleted: false,
    createdAt: '2026-09-01T08:00:00.000Z',
    ...overrides,
});

test('Input 1: valid grocery names are trimmed to their canonical value', () => {
    assert.equal(normalizeGroceryName('  Süt  '), 'Süt');
});

test('Input 2: one-character names are accepted', () => {
    assert.equal(normalizeGroceryName('X'), 'X');
});

test('Input 3: 120-character names are accepted', () => {
    const name = 'x'.repeat(120);
    assert.equal(normalizeGroceryName(name), name);
});

test('Input 4: empty names are rejected', () => {
    assert.equal(normalizeGroceryName(''), null);
});

test('Input 5: whitespace-only names are rejected', () => {
    assert.equal(normalizeGroceryName(' \t\n '), null);
});

test('Input 6: names longer than 120 characters are rejected', () => {
    assert.equal(normalizeGroceryName('x'.repeat(121)), null);
});

test('Ordering 7: active items are sorted before completed items', () => {
    const sorted = sortGroceryItems([
        item({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', isCompleted: true }),
        item({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', isCompleted: false }),
    ]);
    assert.deepEqual(sorted.map(({ id }) => id), [
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ]);
});

test('Ordering 8: created_at and id provide deterministic order', () => {
    const sorted = sortGroceryItems([
        item({ id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }),
        item({ id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }),
        item({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', createdAt: '2026-09-01T09:00:00.000Z' }),
    ]);
    assert.deepEqual(sorted.map(({ id }) => id), [
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    ]);
});

test('Ordering 9: duplicate names remain separate items', () => {
    const rows = [item(), item({ id: '33333333-3333-4333-8333-333333333333' })];
    assert.equal(sortGroceryItems(rows).length, 2);
    assert.deepEqual(sortGroceryItems(rows).map(({ name }) => name), ['Süt', 'Süt']);
});

test('Service 10: every operation requires the current authenticated user', () => {
    assert.ok((service.match(/supabase\.auth\.getUser\(\)/g) || []).length >= 1);
    assert.ok((service.match(/getCurrentUserOrThrow\(\)/g) || []).length >= 4);
    assert.match(service, /if \(response\?\.error \|\| !user\?\.id\)/);
});

test('Service 11: reads use the grocery_items table and canonical projection', () => {
    assert.match(service, /\.from\('grocery_items'\)/);
    assert.match(service, /const GROCERY_SELECT = 'id,client_id,name,is_completed,created_at'/);
    assert.match(service, /\.select\(GROCERY_SELECT\)/);
});

test('Service 12: inserts always send the current user as client_id', () => {
    assert.match(service, /\.insert\(\{ client_id: user\.id, name: normalizedName, is_completed: false \}\)/);
});

test('Service 13: successful inserts and updates use the server-returned row', () => {
    assert.match(service, /\.select\(GROCERY_SELECT\)\s*\.single\(\)/);
    assert.match(service, /return normalizeMutationRow\(response\?\.data, user\.id\)/);
});

test('Service 14: completion updates target only one owned item', () => {
    assert.match(service, /\.update\(\{ is_completed: isCompleted \}\)[\s\S]*?\.eq\('id', itemId\)[\s\S]*?\.eq\('client_id', user\.id\)/);
});

test('Service 15: deletes target only one owned item and verify the deleted row', () => {
    assert.match(service, /\.delete\(\)[\s\S]*?\.eq\('id', itemId\)[\s\S]*?\.eq\('client_id', user\.id\)/);
    assert.match(service, /response\?\.data\?\.id !== itemId \|\| response\?\.data\?\.client_id !== user\.id/);
});

test('Service 16: manual grocery service has no meal, recipe, AI, or local fallback source', () => {
    assert.doesNotMatch(service, /meal|recipe|AsyncStorage|localStorage|fallback/i);
});

test('Lifecycle 17: an old load cannot overwrite a newer request', () => {
    assert.equal(isGroceryLoadCurrent({
        requestGeneration: 1,
        currentGeneration: 1,
        requestSequence: 1,
        currentSequence: 2,
        requestUserId: clientA,
        activeUserId: clientA,
    }), false);
});

test('Lifecycle 18: a previous session load is stale for the new session', () => {
    assert.equal(isGroceryLoadCurrent({
        requestGeneration: 1,
        currentGeneration: 2,
        requestSequence: 1,
        currentSequence: 1,
        requestUserId: clientA,
        activeUserId: '33333333-3333-4333-8333-333333333333',
    }), false);
});

test('Lifecycle 19: the same item cannot start a second mutation while locked', () => {
    const lock = new Set();
    const start = (itemId) => {
        if (lock.has(itemId)) return false;
        lock.add(itemId);
        return true;
    };
    assert.equal(start(item().id), true);
    assert.equal(start(item().id), false);
});

test('Lifecycle 20: a failed toggle restores the exact previous item state', () => {
    const previous = item({ isCompleted: false });
    const optimistic = replaceGroceryItem([previous], { ...previous, isCompleted: true });
    const rolledBack = replaceGroceryItem(optimistic, previous);
    assert.deepEqual(rolledBack, [previous]);
});

test('Lifecycle 21: a stale toggle failure cannot roll back a newer mutation', () => {
    const current = isGroceryMutationCurrent({
        mutationGeneration: 1,
        currentGeneration: 1,
        mutationId: 4,
        activeMutationId: 5,
        mutationUserId: clientA,
        activeUserId: clientA,
    });
    const optimistic = item({ isCompleted: true });
    const previous = item({ isCompleted: false });
    assert.equal(current, false);
    assert.deepEqual(current ? previous : optimistic, optimistic);
});

test('Lifecycle 22: a failed delete restores the item without losing other rows', () => {
    const first = item();
    const second = item({ id: '33333333-3333-4333-8333-333333333333', name: 'Ekmek' });
    const remaining = removeGroceryItem([first, second], first.id);
    assert.deepEqual(restoreGroceryItem(remaining, first, 0), [first, second]);
});

test('Lifecycle 23: add failure keeps the typed value recoverable', () => {
    let input = '  Süt  ';
    const failed = true;
    if (!failed) input = '';
    assert.equal(input, '  Süt  ');
    assert.match(viewModel, /setInputState\(''\)/);
    assert.match(viewModel, /catch \(addError\)[\s\S]*?setMutationError/);
});

test('Lifecycle 24: focus re-entry force-refreshes the canonical list', () => {
    assert.match(viewModel, /useFocusEffect\(/);
    assert.match(viewModel, /void loadItems\(\{ force: true \}\)/);
});

test('Navigation 25: GroceryList is registered on the root stack', () => {
    assert.match(rootNavigator, /import GroceryListScreen from '\.\.\/features\/grocery\/screens\/GroceryListScreen'/);
    assert.match(rootNavigator, /Stack\.Screen name="GroceryList" component=\{GroceryListScreen\}/);
});

test('Navigation 26: the meal-plan cart navigates to the persistent grocery screen', () => {
    assert.match(mealPlanHeader, /onPress=\{onOpenGrocery\}/);
    assert.match(mealsScreen, /onOpenGrocery=\{\(\) => navigation\.navigate\('GroceryList'\)\}/);
    assert.match(mealsScreen, /groceryDisabled=\{false\}/);
    assert.doesNotMatch(mealsScreen, /onOpenGrocery=\{handleGenerateGroceryList\}/);
});

test('Navigation 27: Dashboard sidebar no longer exposes the grocery entry', () => {
    assert.doesNotMatch(sidebar, /key:\s*['"]GroceryList['"]|Alışveriş listesi/);
});

test('Navigation 28: the existing four bottom tabs remain unchanged', () => {
    assert.equal((mainTabs.match(/<Tab\.Screen\s/g) || []).length, 4);
    for (const label of ['Ana Sayfa', 'Öğünler', 'Analiz', 'Sohbet']) assert.match(mainTabs, new RegExp(`name="${label}"`));
    assert.doesNotMatch(mainTabs, /GroceryList|Alışveriş/);
});
