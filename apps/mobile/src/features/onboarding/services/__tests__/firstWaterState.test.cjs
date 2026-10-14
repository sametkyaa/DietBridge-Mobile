'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function loadStore(AsyncStorage) {
    const source = fs.readFileSync(path.join(__dirname, '../onboardingStateStore.js'), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export const /g, 'const ');
    return new Function('AsyncStorage', `${source}; return { readOnboardingState, updateOnboardingState };`)(AsyncStorage);
}

test('legacy progress survives concurrent setup/dismiss patches and remains per account', async () => {
    const values = new Map([['dietbridge:onboarding:v1:a', JSON.stringify({ setupCompleted: true })]]);
    const store = loadStore({ getItem: async key => values.get(key), setItem: async (key, value) => values.set(key, value) });
    assert.equal((await store.readOnboardingState('a')).firstWaterLogged, false);
    await Promise.all([
        store.updateOnboardingState('a', { firstWaterLogged: true }),
        store.updateOnboardingState('a', { checklistDismissed: true }),
        store.updateOnboardingState('a', { setupCompleted: true }),
    ]);
    assert.deepEqual(await store.readOnboardingState('a'), {
        firstWaterLogged: true, checklistDismissed: true, setupCompleted: true,
    });
    await store.updateOnboardingState('a', { firstWaterLogged: false });
    assert.equal((await store.readOnboardingState('a')).firstWaterLogged, true);
    assert.equal((await store.readOnboardingState('b')).firstWaterLogged, false);
    assert.equal((await store.readOnboardingState(null)).firstWaterLogged, false);
});

test('a failed local write is reported and does not block subsequent writes', async () => {
    const values = new Map();
    let fail = true;
    const store = loadStore({
        getItem: async key => values.get(key),
        setItem: async (key, value) => { if (fail) throw new Error('storage unavailable'); values.set(key, value); },
    });
    await assert.rejects(store.updateOnboardingState('a', { firstWaterLogged: true }), /storage unavailable/);
    fail = false;
    await store.updateOnboardingState('a', { firstWaterLogged: true });
    assert.equal((await store.readOnboardingState('a')).firstWaterLogged, true);
});
