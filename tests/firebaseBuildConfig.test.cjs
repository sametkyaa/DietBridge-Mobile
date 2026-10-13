const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const configure = require('../app.config.js');
const config = { android: { package: 'com.dietbridge.app', versionCode: 1 }, ios: { bundleIdentifier: 'com.dietbridge.app' } };
test('Android native build requires matching Firebase config and rejects a service-account key', () => {
    const originalFile = process.env.GOOGLE_SERVICES_JSON, originalPlatform = process.env.EAS_BUILD_PLATFORM;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dietbridge-firebase-config-'));
    try {
        const file = path.join(root, 'google-services.json');
        process.env.GOOGLE_SERVICES_JSON = file; process.env.EAS_BUILD_PLATFORM = 'android';
        assert.throws(() => configure({ config }), /requires/);
        fs.writeFileSync(file, JSON.stringify({ type: 'service_account', private_key: 'fake-test-only' }));
        assert.throws(() => configure({ config }), /private key/);
        fs.writeFileSync(file, JSON.stringify({ project_info: { project_id: 'test-project' }, client: [{ client_info: { android_client_info: { package_name: 'wrong.app' } } }] }));
        assert.throws(() => configure({ config }), /match/);
        fs.writeFileSync(file, JSON.stringify({ project_info: { project_id: 'test-project' }, client: [{ client_info: { android_client_info: { package_name: 'com.dietbridge.app' } } }] }));
        const result = configure({ config }); assert.equal(result.android.googleServicesFile, file); assert.equal(result.android.versionCode, 1); assert.deepEqual(result.ios, config.ios);
    } finally {
        if (originalFile === undefined) delete process.env.GOOGLE_SERVICES_JSON; else process.env.GOOGLE_SERVICES_JSON = originalFile;
        if (originalPlatform === undefined) delete process.env.EAS_BUILD_PLATFORM; else process.env.EAS_BUILD_PLATFORM = originalPlatform;
        fs.rmSync(root, { recursive: true, force: true });
    }
});
