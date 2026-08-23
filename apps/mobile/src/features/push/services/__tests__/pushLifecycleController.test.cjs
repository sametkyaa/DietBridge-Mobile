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
