const assert = require('node:assert/strict');
const test = require('node:test');
const policy = require('../externalLinkPolicy.cjs');

test('legal URLs and support email are exact', () => {
    assert.equal(policy.TERMS_URL, 'https://dietbridge.com.tr/kullanim-kosullari');
    assert.equal(policy.PRIVACY_URL, 'https://dietbridge.com.tr/gizlilik-politikasi');
    assert.equal(policy.KVKK_URL, 'https://dietbridge.com.tr/kvkk');
    assert.equal(policy.SUPPORT_EMAIL, 'dietbridge.official@gmail.com');
    assert.equal(policy.SUPPORT_MAILTO_URL, 'mailto:dietbridge.official@gmail.com');
});

test('only exact DietBridge legal URLs and support mailto are allowed', () => {
    assert.equal(policy.isAllowedExternalTarget(policy.TERMS_URL), true);
    assert.equal(policy.isAllowedExternalTarget(policy.PRIVACY_URL), true);
    assert.equal(policy.isAllowedExternalTarget(policy.KVKK_URL), true);
    assert.equal(policy.isAllowedExternalTarget(policy.SUPPORT_MAILTO_URL), true);
    assert.equal(policy.isAllowedExternalTarget('#'), false);
    assert.equal(policy.isAllowedExternalTarget('http://dietbridge.com.tr/'), false);
    assert.equal(policy.isAllowedExternalTarget('https://example.com/'), false);
    assert.equal(policy.isAllowedExternalTarget('https://dietbridge.com.tr.evil.example/'), false);
});

test('external opening succeeds only after canOpenURL and handles failures safely', async () => {
    const calls = [];
    const opened = await policy.openExternalTarget(policy.TERMS_URL, {
        canOpenURL: async (target) => {
            calls.push(['canOpenURL', target]);
            return true;
        },
        openURL: async (target) => {
            calls.push(['openURL', target]);
        },
        onFailure: () => {
            calls.push(['failure']);
        },
    });

    assert.equal(opened, true);
    assert.deepEqual(calls, [
        ['canOpenURL', policy.TERMS_URL],
        ['openURL', policy.TERMS_URL],
    ]);
});

test('unsupported or rejected external opening returns false without crashing', async () => {
    const failures = [];
    const unsupported = await policy.openExternalTarget(policy.SUPPORT_MAILTO_URL, {
        canOpenURL: async () => false,
        openURL: async () => {
            throw new Error('must not open');
        },
        onFailure: (error) => failures.push(error.message),
    });
    const rejected = await policy.openExternalTarget(policy.PRIVACY_URL, {
        canOpenURL: async () => true,
        openURL: async () => {
            throw new Error('open failed');
        },
        onFailure: (error) => failures.push(error.message),
    });

    assert.equal(unsupported, false);
    assert.equal(rejected, false);
    assert.deepEqual(failures, [
        'External target is not supported on this device.',
        'open failed',
    ]);
});

test('arbitrary targets never reach the platform opener', async () => {
    let openCalls = 0;
    const opened = await policy.openExternalTarget('https://attacker.example/', {
        canOpenURL: async () => {
            throw new Error('must not check');
        },
        openURL: async () => {
            openCalls += 1;
        },
        onFailure: () => {
            throw new Error('must not report arbitrary target');
        },
    });

    assert.equal(opened, false);
    assert.equal(openCalls, 0);
});
