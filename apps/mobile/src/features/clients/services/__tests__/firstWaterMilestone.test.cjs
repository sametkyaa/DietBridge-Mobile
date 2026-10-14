'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const waterContract = require('../../../../shared/utils/waterTrackingContract.cjs');

function harness({ userId = 'client-a', error = null, water = 0.25, history = [] } = {}) {
    const calls = [];
    const milestones = [];
    const query = {
        select: fields => { calls.push(['select', fields]); return query; },
        eq: (...args) => { calls.push(['eq', ...args]); return query; },
        gt: (...args) => { calls.push(['gt', ...args]); return query; },
        limit: value => { calls.push(['limit', value]); return Promise.resolve({ data: history, error, status: 200 }); },
        upsert: () => query,
        single: async () => ({ data: { water_intake: water }, error, status: 200 }),
    };
    const supabase = {
        auth: { getUser: async () => ({ data: { user: { id: userId } }, error: null }) },
        from: table => { calls.push(['from', table]); return query; },
    };
    const source = fs.readFileSync(path.join(__dirname, '../dailyLogService.js'), 'utf8')
        .replace(/^import .*;\r?\n/gm, '').replace(/export const /g, 'const ');
    const service = new Function('supabase', 'saveCurrentWeight', 'requireHealthStorageConsent', 'updateOnboardingState', 'require',
        `${source}; return { hasRecordedWater, upsertWaterIntake };`)(
        supabase, async () => {}, async () => {},
        async (...args) => { milestones.push(args); }, () => waterContract,
    );
    return { ...service, calls, milestones };
}

test('history lookup is bounded, scoped to the signed-in client and includes previous days', async () => {
    const h = harness({ history: [{ client_id: 'client-a' }] });
    assert.equal(await h.hasRecordedWater('client-a'), true);
    assert.deepEqual(h.calls, [
        ['from', 'daily_logs'], ['select', 'client_id'], ['eq', 'client_id', 'client-a'], ['gt', 'water_intake', 0], ['limit', 1],
    ]);
    assert.equal(await harness().hasRecordedWater('client-a'), false);
});

test('history cannot query another account and backend errors are not empty history', async () => {
    const h = harness();
    await assert.rejects(h.hasRecordedWater('client-b'));
    assert.equal(h.calls.length, 0);
    await assert.rejects(harness({ error: { message: 'permission denied' } }).hasRecordedWater('client-a'));
});

test('only a successful positive persisted water save sets the account milestone', async () => {
    const h = harness();
    assert.equal(await h.upsertWaterIntake('2026-10-14', 0.25), 0.25);
    assert.deepEqual(h.milestones, [['client-a', { firstWaterLogged: true }]]);
    const zero = harness({ water: 0 });
    await zero.upsertWaterIntake('2026-10-14', 0);
    assert.equal(zero.milestones.length, 0);
    const failed = harness({ error: { message: 'write failed' } });
    await assert.rejects(failed.upsertWaterIntake('2026-10-14', 0.25));
    assert.equal(failed.milestones.length, 0);
});
