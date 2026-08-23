'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    PUSH_CAPABILITY_STATUS,
    createInstallationIdStore,
    getAndroidChannelConfigs,
    normalizePermissionState,
    resolveEasProjectId,
    isExpoPushToken,
    isUuid,
} = require('../pushClientPolicy.cjs');

const UUID_A = '11111111-1111-4111-8111-111111111111';
const UUID_B = '22222222-2222-4222-8222-222222222222';

test('installation identity is generated once, persisted, and stable', async () => {
    const values = new Map();
    let generated = 0;
    const store = createInstallationIdStore({
        key: 'installation',
        storage: {
            getItem: async (key) => values.get(key) || null,
            setItem: async (key, value) => values.set(key, value),
        },
        crypto: { randomUUID: () => { generated += 1; return UUID_A; } },
    });

    assert.equal(await store.getOrCreate(), UUID_A);
    assert.equal(await store.getOrCreate(), UUID_A);
    assert.equal(generated, 1);
    assert.equal(await store.getStored(), UUID_A);
});

test('concurrent installation callers converge on one persisted UUID', async () => {
    const values = new Map();
    let generated = 0;
    const store = createInstallationIdStore({
        key: 'installation',
        storage: {
            getItem: async (key) => { await new Promise((resolve) => setTimeout(resolve, 5)); return values.get(key) || null; },
            setItem: async (key, value) => { await new Promise((resolve) => setTimeout(resolve, 5)); values.set(key, value); },
        },
        crypto: { randomUUID: () => { generated += 1; return UUID_B; } },
    });

    const results = await Promise.all([store.getOrCreate(), store.getOrCreate(), store.getOrCreate()]);
    assert.deepEqual(results, [UUID_B, UUID_B, UUID_B]);
    assert.equal(generated, 1);
    assert.equal(values.get('installation'), UUID_B);
});

test('malformed stored identity is replaced with a valid UUID', async () => {
    const values = new Map([['installation', 'not-a-user-id']]);
    const store = createInstallationIdStore({
        key: 'installation',
        storage: {
            getItem: async (key) => values.get(key) || null,
            setItem: async (key, value) => values.set(key, value),
        },
        crypto: { randomUUID: () => UUID_A },
    });

    assert.equal(await store.getOrCreate(), UUID_A);
    assert.equal(values.get('installation'), UUID_A);
});

test('project id resolution uses expoConfig then easConfig and fails closed', () => {
    assert.equal(resolveEasProjectId({
        expoConfig: { extra: { eas: { projectId: UUID_A } } },
        easConfig: { projectId: UUID_B },
    }).projectId, UUID_A);
    assert.equal(resolveEasProjectId({ easConfig: { projectId: UUID_B } }).projectId, UUID_B);
    assert.equal(resolveEasProjectId({}).code, 'PROJECT_ID_MISSING');
    assert.equal(resolveEasProjectId({ easConfig: { projectId: 'placeholder' } }).code, 'PROJECT_ID_INVALID');
});

test('permission normalization preserves passive and iOS authorization states', () => {
    assert.equal(normalizePermissionState({ platform: 'ios', isDevice: true, permissionResponse: { ios: { status: 0 } } }).status, PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED);
    assert.equal(normalizePermissionState({ platform: 'ios', isDevice: true, permissionResponse: { ios: { status: 1 } } }).status, PUSH_CAPABILITY_STATUS.PERMISSION_DENIED);
    for (const status of [2, 3, 4]) {
        assert.equal(normalizePermissionState({ platform: 'ios', isDevice: true, permissionResponse: { ios: { status } } }).status, PUSH_CAPABILITY_STATUS.PERMISSION_GRANTED);
    }
    assert.equal(normalizePermissionState({ platform: 'android', isDevice: true, appOwnership: 'expo', permissionResponse: { granted: true } }).status, PUSH_CAPABILITY_STATUS.UNSUPPORTED_RUNTIME);
    assert.equal(normalizePermissionState({ platform: 'android', isDevice: true, permissionResponse: { granted: false, canAskAgain: false } }).status, PUSH_CAPABILITY_STATUS.PERMISSION_DENIED);
});

test('Android channels are minimal, stable, and never request an icon badge or custom sound', () => {
    const configs = getAndroidChannelConfigs({ importance: { LOW: 4, DEFAULT: 5 } });
    assert.deepEqual(configs.map((config) => config.id), ['dietbridge-silent', 'dietbridge-appointments']);
    assert.equal(configs[0].sound, null);
    assert.equal(configs[1].sound, 'default');
    assert.equal(configs[0].showBadge, false);
    assert.equal(configs[1].showBadge, false);
    assert.equal(configs.some((config) => config.sound === 'custom'), false);
});

test('identity and Expo token validators do not accept user or arbitrary values', () => {
    assert.equal(isUuid(UUID_A), true);
    assert.equal(isUuid('client-' + UUID_A), false);
    assert.equal(isExpoPushToken('ExpoPushToken[synthetic-token]'), true);
    assert.equal(isExpoPushToken('real-token'), false);
});
