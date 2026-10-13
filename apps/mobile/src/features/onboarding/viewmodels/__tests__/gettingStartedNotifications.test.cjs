'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Run the real ViewModel with isolated hooks and native/service boundaries.
// No React Native runtime, account, device token or database is used.
function harness({ enable = async () => ({ status: 'registered' }), openSettings = async () => {} } = {}) {
    const values = [];
    const effects = [];
    const listeners = new Set();
    const alerts = [];
    let index = 0;
    let permission = 'permission_denied';
    let settingsCalls = 0;
    const inputs = {
        useState: initial => {
            const slot = index++;
            if (!(slot in values)) values[slot] = initial;
            return [values[slot], value => { values[slot] = typeof value === 'function' ? value(values[slot]) : value; }];
        },
        useRef: initial => {
            const slot = index++;
            if (!(slot in values)) values[slot] = { current: initial };
            return values[slot];
        },
        useEffect: (fn, deps) => {
            const slot = index++;
            if (!effects[slot] || deps.some((value, i) => value !== effects[slot].deps[i])) {
                effects[slot]?.cleanup?.();
                effects[slot] = { deps, cleanup: fn() };
            }
        },
        useCallback: fn => fn,
        useMemo: fn => fn(),
        useFocusEffect: () => {},
        Alert: { alert: (...args) => alerts.push(args) },
        AppState: {
            currentState: 'active',
            addEventListener: (_event, fn) => {
                listeners.add(fn);
                return { remove: () => listeners.delete(fn) };
            },
        },
        Linking: { openSettings: async () => { settingsCalls += 1; return openSettings(); } },
        getClientProfile: async () => ({}),
        enablePushNotifications: enable,
        getPushPermissionState: async () => ({ status: permission }),
        isProfileSetUp: () => true,
        readOnboardingState: async () => ({ checklistDismissed: false }),
        updateOnboardingState: async () => {},
    };
    const source = fs.readFileSync(path.join(__dirname, '../useGettingStartedViewModel.js'), 'utf8')
        .replace(/^import .*;\r?\n/gm, '')
        .replace('export function', 'function');
    const viewModelFactory = new Function(...Object.keys(inputs), `${source}; return useGettingStartedViewModel;`)(...Object.values(inputs));
    return {
        render: () => {
            index = 0;
            return viewModelFactory({ userId: 'synthetic-user', hasActiveDietitian: true, isLoadingConnection: false, water: 250 });
        },
        alerts,
        setPermission: value => { permission = value; },
        emit: value => listeners.forEach(fn => fn(value)),
        unmount: () => effects.forEach(effect => effect?.cleanup?.()),
        get settingsCalls() { return settingsCalls; },
        get listenerCount() { return listeners.size; },
    };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('denied permission explains the problem and opens settings only when selected', async () => {
    const h = harness({ enable: async () => ({ status: 'permission_denied', canAskAgain: false }) });
    await h.render().enableNotifications();
    assert.equal(h.alerts[0][0], 'Bildirim izni kapalı');
    assert.equal(h.settingsCalls, 0);
    const buttons = h.alerts[0][2];
    assert.equal(buttons[0].style, 'cancel');
    await buttons.find(button => button.text === 'Ayarları aç').onPress();
    assert.equal(h.settingsCalls, 1);
    h.unmount();
});

test('settings opening failure gives manual recovery instructions', async () => {
    const h = harness({
        enable: async () => ({ status: 'permission_denied' }),
        openSettings: async () => { throw new Error('native detail'); },
    });
    await h.render().enableNotifications();
    await h.alerts[0][2][1].onPress();
    assert.equal(h.alerts[1][0], 'Ayarlar açılamadı');
    assert.match(h.alerts[1][1], /DietBridge/);
    assert.doesNotMatch(h.alerts[1][1], /native detail/);
    h.unmount();
});

test('registration, token, configuration and session failures are visible and never report success', async () => {
    for (const status of ['registration_failed', 'token_unavailable', 'configuration_missing', 'unauthenticated', 'session_changed']) {
        const h = harness({ enable: async () => ({ status, code: 'private backend detail' }) });
        await h.render().enableNotifications();
        assert.equal(h.alerts[0][0], 'Bildirimler açılamadı');
        assert.doesNotMatch(h.alerts[0][1], /private backend detail/);
        assert.equal(h.render().isEnablingPush, false);
        h.unmount();
    }
});

test('thrown request errors are visible without exposing their technical details', async () => {
    const h = harness({ enable: async () => { throw new Error('secret detail'); } });
    await h.render().enableNotifications();
    assert.equal(h.alerts[0][0], 'Bildirimler açılamadı');
    assert.doesNotMatch(h.alerts[0][1], /secret detail/);
    assert.equal(h.render().isEnablingPush, false);
    h.unmount();
});

test('repeated taps before a render make only one request and show busy state', async () => {
    let finish;
    let calls = 0;
    const pending = new Promise(resolve => { finish = resolve; });
    const h = harness({ enable: () => { calls += 1; return pending; } });
    const viewModel = h.render();
    const first = viewModel.enableNotifications();
    await viewModel.enableNotifications();
    assert.equal(calls, 1);
    assert.equal(h.render().isEnablingPush, true);
    finish({ status: 'registered' });
    await first;
    assert.equal(h.render().isEnablingPush, false);
    assert.equal(h.alerts.length, 0);
    h.unmount();
});

test('returning from phone settings refreshes permission and completes the checklist', async () => {
    const h = harness();
    h.render();
    await flush();
    await h.render().enableNotifications();
    assert.equal(h.render().completedCount, 3);
    assert.equal(h.render().visible, true);
    h.emit('background');
    h.setPermission('permission_granted');
    h.emit('active');
    await flush();
    assert.equal(h.render().completedCount, 4);
    assert.equal(h.render().visible, false);
    h.unmount();
    assert.equal(h.listenerCount, 0);
});

test('permission result arriving after unmount does not show an alert', async () => {
    let finish;
    const pending = new Promise(resolve => { finish = resolve; });
    const h = harness({ enable: () => pending });
    const request = h.render().enableNotifications();
    h.unmount();
    finish({ status: 'permission_denied' });
    await request;
    assert.equal(h.alerts.length, 0);
});
