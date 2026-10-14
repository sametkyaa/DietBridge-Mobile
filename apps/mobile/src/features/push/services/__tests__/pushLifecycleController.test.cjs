'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createPushLifecycleController } = require('../../utils/pushLifecycleController.cjs');

const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const INSTALLATION = '11111111-1111-4111-8111-111111111111';
const PROJECT = '22222222-2222-4222-8222-222222222222';
const TOKEN_1 = 'ExpoPushToken[synthetic-one]';
const TOKEN_2 = 'ExponentPushToken[synthetic-two]';

const createDeps = (overrides = {}) => {
    const calls = [];
    const listeners = [];
    const deps = {
        getPermissionState: async () => ({ status: 'permission_granted', platform: 'android' }),
        requestPermission: async () => ({ status: 'permission_granted', platform: 'android' }),
        ensureAndroidChannels: async () => { calls.push('channels'); },
        resolveProjectId: () => ({ ok: true, projectId: PROJECT }),
        getExpoPushToken: async () => { calls.push('token'); return TOKEN_1; },
        getInstallationId: async () => INSTALLATION,
        registerInstallation: async (payload) => { calls.push({ register: payload }); return payload; },
        addPushTokenListener: (listener) => { listeners.push(listener); return { remove: () => calls.push('listener-removed') }; },
        appState: {
            currentState: 'active',
            addEventListener: (_event, listener) => ({ remove: () => calls.push('appstate-removed'), listener }),
        },
        getPlatform: () => 'android',
        getAppInfo: () => ({ platform: 'android', appVersion: '1.0.0', nativeBuildVersion: '1' }),
    };
    return { calls, listeners, deps: { ...deps, ...overrides } };
};

test('native FCM rotation is exchanged for Expo token, not registered as native token', async () => {
    const registrations = [];
    const tokens = [];
    const native = { type: 'android', data: 'synthetic-native-fcm-token' };
    const { listeners, deps } = createDeps({
        getExpoPushToken: async (_projectId, options) => { tokens.push(options); return options?.devicePushToken ? TOKEN_2 : TOKEN_1; },
        registerInstallation: async (payload) => { registrations.push(payload); return payload; },
    });
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    listeners[0](native);
    await controller.reconcile();
    assert.deepEqual(tokens[1], { devicePushToken: native });
    assert.equal(registrations.at(-1).expoPushToken, TOKEN_2);
    assert.equal(registrations.at(-1).installationId, INSTALLATION);
    controller.dispose();
});

test('transient token failure retries without asking permission and stops on logout', async () => {
    const timers = new Map();
    const delays = [];
    let attempts = 0;
    let prompts = 0;
    const { deps } = createDeps({
        getExpoPushToken: async () => {
            attempts += 1;
            if (attempts === 1) throw Object.assign(new Error('offline'), { code: 'token_unavailable' });
            return TOKEN_1;
        },
        requestPermission: async () => { prompts += 1; },
        scheduleTimer: (fn, delay) => { delays.push(delay); timers.set(1, fn); return 1; },
        cancelTimer: (id) => timers.delete(id),
        random: () => 0,
    });
    const controller = createPushLifecycleController(deps);
    assert.equal((await controller.setSession({ user: { id: USER_A } })).status, 'token_unavailable');
    assert.deepEqual(delays, [2000]);
    const retry = timers.get(1); timers.delete(1); retry();
    assert.equal((await controller.reconcile()).status, 'registered');
    assert.equal(prompts, 0);
    await controller.setSession(null);
    retry();
    assert.equal(attempts, 2);
    assert.equal(timers.size, 0);
    controller.dispose();
});

test('retry count is bounded and permanent configuration failure has no retry', async () => {
    const timers = [];
    const { deps } = createDeps({
        getExpoPushToken: async () => { throw Object.assign(new Error('offline'), { code: 'token_unavailable' }); },
        scheduleTimer: (fn) => { timers.push(fn); return timers.length; },
        cancelTimer: () => {}, random: () => 0,
    });
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    for (let i = 0; i < 4; i += 1) { timers[i](); await controller.reconcile(); }
    assert.equal(timers.length, 4);
    controller.dispose();
    let scheduled = 0;
    const bad = createPushLifecycleController(createDeps({
        resolveProjectId: () => ({ ok: false, code: 'PROJECT_ID_MISSING' }),
        scheduleTimer: () => { scheduled += 1; },
    }).deps);
    await bad.setSession({ user: { id: USER_A } });
    assert.equal(scheduled, 0);
    bad.dispose();
});

test('passive reconciliation never prompts and does not register when permission is not determined', async () => {
    let prompted = 0;
    let registered = 0;
    const { deps } = createDeps({
        getPermissionState: async () => ({ status: 'permission_not_determined', platform: 'android' }),
        requestPermission: async () => { prompted += 1; return { status: 'permission_granted' }; },
        registerInstallation: async () => { registered += 1; },
    });
    const controller = createPushLifecycleController(deps);
    const result = await controller.setSession({ user: { id: USER_A } });
    assert.equal(result.status, 'permission_not_determined');
    assert.equal(prompted, 0);
    assert.equal(registered, 0);
    controller.dispose();
});

test('explicit enable creates channels before permission/token/register and sends no user_id', async () => {
    const { calls, deps } = createDeps({
        getPermissionState: async () => ({ status: 'permission_not_determined', platform: 'android' }),
    });
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    calls.length = 0;
    const result = await controller.enablePushNotifications();
    assert.equal(result.status, 'registered');
    assert.equal(calls[0], 'channels');
    assert.equal(calls[1], 'channels');
    assert.equal(calls[2], 'token');
    const registerCall = calls.find((call) => call.register)?.register;
    assert.equal(registerCall.installationId, INSTALLATION);
    assert.equal(registerCall.projectId, PROJECT);
    assert.equal(Object.hasOwn(registerCall, 'user_id'), false);
    controller.dispose();
});

test('missing project id stops before token acquisition or registration', async () => {
    let tokenCalls = 0;
    let registrationCalls = 0;
    const { deps } = createDeps({
        resolveProjectId: () => ({ ok: false, status: 'configuration_missing', code: 'PROJECT_ID_MISSING' }),
        getExpoPushToken: async () => { tokenCalls += 1; return TOKEN_1; },
        registerInstallation: async () => { registrationCalls += 1; },
    });
    const controller = createPushLifecycleController(deps);
    const result = await controller.setSession({ user: { id: USER_A } });
    assert.equal(result.status, 'configuration_missing');
    assert.equal(tokenCalls, 0);
    assert.equal(registrationCalls, 0);
    controller.dispose();
});

test('token rotation keeps installation identity and registers the new token', async () => {
    const registrations = [];
    const { listeners, deps } = createDeps({
        registerInstallation: async (payload) => { registrations.push(payload); return payload; },
    });
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    assert.equal(listeners.length, 1);
    listeners[0]({ data: TOKEN_2 });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(registrations.length, 2);
    assert.equal(registrations[0].installationId, INSTALLATION);
    assert.equal(registrations[1].installationId, INSTALLATION);
    assert.equal(registrations[1].expoPushToken, TOKEN_2);
    controller.dispose();
});

test('account switching reuses installation identity but reconciles under the current session', async () => {
    const registrations = [];
    const { deps } = createDeps({
        registerInstallation: async (payload) => { registrations.push(payload); return payload; },
    });
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    await controller.setSession({ user: { id: USER_B } });
    assert.equal(registrations.length, 2);
    assert.equal(registrations[0].installationId, INSTALLATION);
    assert.equal(registrations[1].installationId, INSTALLATION);
    assert.equal(Object.hasOwn(registrations[1], 'user_id'), false);
    controller.dispose();
});

test('foreground reconciliation is deduped and listener cleanup is explicit', async () => {
    const { calls, deps } = createDeps();
    let appListener;
    deps.appState = {
        currentState: 'background',
        addEventListener: (_event, listener) => { appListener = listener; return { remove: () => calls.push('appstate-removed') }; },
    };
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    appListener('active');
    appListener('active');
    await controller.reconcile();
    controller.dispose();
    assert.equal(calls.filter((call) => call === 'appstate-removed').length, 1);
    assert.equal(calls.filter((call) => call === 'listener-removed').length, 1);
});

test('previous denial can be retried only by an explicit user action when the OS allows it', async () => {
    let prompts = 0;
    const { calls, deps } = createDeps({
        getPermissionState: async () => ({ status: 'permission_denied', canAskAgain: true }),
        requestPermission: async () => { prompts += 1; return { status: 'permission_granted' }; },
    });
    const controller = createPushLifecycleController(deps);
    await controller.setSession({ user: { id: USER_A } });
    assert.equal(prompts, 0);
    const result = await controller.enablePushNotifications();
    assert.equal(result.status, 'registered');
    assert.equal(prompts, 1);
    assert.equal(calls.filter(call => call.register).length, 1);
    controller.dispose();
});

test('blocked or unknown denial does not prompt, acquire tokens or register', async () => {
    for (const canAskAgain of [false, null]) {
        const { calls, deps } = createDeps({
            getPermissionState: async () => ({ status: 'permission_denied', canAskAgain }),
            requestPermission: async () => assert.fail('OS cannot be prompted'),
        });
        const controller = createPushLifecycleController(deps);
        await controller.setSession({ user: { id: USER_A } });
        assert.equal((await controller.enablePushNotifications()).status, 'permission_denied');
        assert.equal(calls.includes('token'), false);
        assert.equal(calls.some(call => call.register), false);
        controller.dispose();
    }
});

test('enable pressed during startup is preserved and rapid taps request permission once', async () => {
    let releaseStartup;
    const pending = new Promise(resolve => { releaseStartup = resolve; });
    let reads = 0;
    let prompts = 0;
    const { calls, deps } = createDeps({
        getPermissionState: async () => {
            if (++reads === 1) await pending;
            return { status: 'permission_not_determined', canAskAgain: true };
        },
        requestPermission: async () => { prompts += 1; return { status: 'permission_granted' }; },
    });
    const controller = createPushLifecycleController(deps);
    const startup = controller.setSession({ user: { id: USER_A } });
    const enable = controller.enablePushNotifications();
    assert.equal(controller.enablePushNotifications(), enable);
    releaseStartup();
    assert.equal((await startup).status, 'permission_not_determined');
    assert.equal((await enable).status, 'registered');
    assert.equal(prompts, 1);
    assert.equal(calls.filter(call => call.register).length, 1);
    controller.dispose();
});

test('queued permission action does not prompt after the user logs out or switches accounts', async () => {
    for (const nextSession of [null, { user: { id: USER_B } }]) {
        let finish;
        const pending = new Promise(resolve => { finish = resolve; });
        const { deps } = createDeps({
            getPermissionState: async () => { await pending; return { status: 'permission_not_determined' }; },
            requestPermission: async () => assert.fail('stale action must not prompt'),
        });
        const controller = createPushLifecycleController(deps);
        const startup = controller.setSession({ user: { id: USER_A } });
        const enable = controller.enablePushNotifications();
        const changed = controller.setSession(nextSession);
        finish();
        await Promise.all([startup, changed]);
        assert.equal((await enable).status, 'session_changed');
        controller.dispose();
    }
});
