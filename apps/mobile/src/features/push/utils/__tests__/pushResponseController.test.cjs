const test = require('node:test');
const assert = require('node:assert/strict');
const { createPushResponseController } = require('../pushResponseController.cjs');
const id = '11111111-1111-4111-8111-111111111111';
const response = (requestId = 'first', data = { version: 1, notificationId: id }) => ({ actionIdentifier: 'expo.modules.notifications.actions.DEFAULT', notification: { request: { identifier: requestId, content: { data } } } });
const settle = () => new Promise(resolve => setImmediate(resolve));
function harness(overrides = {}) {
    const calls = [], opens = [], errors = [];
    const controller = createPushResponseController({ userId: 'owner', fetchNotification: async value => { calls.push(value); return { recipientId: 'owner' }; },
        openCenter: () => opens.push(true), isReady: () => true, clearResponse: async () => {}, onError: () => errors.push(true), ...overrides });
    return { controller, calls, opens, errors };
}
test('warm and cold duplicate response opens once after an owned server lookup', async () => {
    const h = harness(); h.controller.receive(response()); h.controller.receive(response()); await settle();
    assert.deepEqual(h.calls, [id]); assert.equal(h.opens.length, 1);
});
test('cold response waits until authenticated navigator is ready', async () => {
    let ready = false; const h = harness({ isReady: () => ready }); h.controller.receive(response()); await settle();
    assert.equal(h.calls.length, 0); ready = true; await h.controller.flush(); assert.equal(h.opens.length, 1);
});
test('foreign, deleted and unsupported notifications never open a route', async () => {
    for (const row of [null, { recipientId: 'another-account' }]) {
        const h = harness({ fetchNotification: async () => row }); h.controller.receive(response()); await settle(); assert.equal(h.opens.length, 0);
    }
});
test('invalid IDs, unknown payload versions and arbitrary URL instructions are ignored', async () => {
    const h = harness();
    for (const data of [{ version: 1, notificationId: 'bad' }, { version: 2, notificationId: id }, { url: 'https://evil.invalid' }, null]) h.controller.receive(response('invalid', data));
    await settle(); assert.equal(h.calls.length, 0); assert.equal(h.opens.length, 0);
});
test('logout, account replacement or unmount invalidates asynchronous lookup', async () => {
    let release; const h = harness({ fetchNotification: () => new Promise(resolve => { release = resolve; }) });
    h.controller.receive(response()); await settle(); h.controller.dispose(); release({ recipientId: 'owner' }); await settle(); assert.equal(h.opens.length, 0);
});
test('lookup failure gives a controlled error and cannot navigate', async () => {
    const h = harness({ fetchNotification: async () => { throw new Error('private backend error'); } });
    h.controller.receive(response()); await settle(); assert.equal(h.opens.length, 0); assert.equal(h.errors.length, 1);
});
