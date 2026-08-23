'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Expo configuration adds only the standard notifications plugin and no permanent identifiers', () => {
    const app = read('app.json');
    const appSource = read('App.js');
    assert.match(app, /expo-notifications/);
    assert.doesNotMatch(app, /extra.*eas|projectId|android.*package|ios.*bundleIdentifier/);
    assert.equal(fs.existsSync(path.join(root, 'android')), false);
    assert.equal(fs.existsSync(path.join(root, 'ios')), false);
    assert.doesNotMatch(appSource, /requestPermissionsAsync/);
});

test('registration uses the exact authenticated RPC boundary and never sends user_id or direct table DML', () => {
    const service = read('apps/mobile/src/features/push/services/pushRegistrationService.js');
    assert.match(service, /supabaseClient\.auth\.getUser\(\)/);
    assert.match(service, /rpc\('register_push_installation'/);
    assert.match(service, /p_installation_id/);
    assert.match(service, /p_expo_push_token/);
    assert.match(service, /p_project_id/);
    assert.doesNotMatch(service, /user_id\s*:/);
    assert.doesNotMatch(service, /from\(['"]push_installations['"]\)/);
    assert.doesNotMatch(service, /console\.(log|warn|error).*token/i);
});

test('revoke is installation-scoped, token-free, and best effort before local sign-out', () => {
    const service = read('apps/mobile/src/features/push/services/pushRegistrationService.js');
    const auth = read('apps/mobile/src/features/auth/services/authService.js');
    const client = read('apps/mobile/src/features/clients/services/clientService.js');
    assert.match(service, /rpc\('revoke_push_installation'/);
    assert.match(service, /p_installation_id/);
    assert.doesNotMatch(service, /(?:p_expo_push_token[\s\S]{0,120}revoke|revoke[\s\S]{0,120}expoPushToken)/);
    assert.match(auth, /revokePushInstallationBestEffort/);
    assert.match(client, /revokePushInstallationBestEffort/);
    assert.match(auth, /revokePushInstallationBestEffort\(\);[\s\S]*supabase\.auth\.signOut/);
    assert.match(client, /revokePushInstallationBestEffort\(\);[\s\S]*supabase\.auth\.signOut/);
});

test('lifecycle integration is separate from NotificationProvider and does not add Push navigation or badge state', () => {
    const app = read('App.js');
    const lifecycle = read('apps/mobile/src/features/push/services/pushLifecycleService.js');
    const component = read('apps/mobile/src/features/push/components/PushLifecycleController.js');
    assert.match(app, /PushLifecycleController/);
    assert.match(component, /return null/);
    assert.match(lifecycle, /addPushTokenListener/);
    assert.doesNotMatch(lifecycle, /setBadgeCountAsync|addNotificationResponseReceivedListener/);
    assert.doesNotMatch(component, /NotificationProvider|NotificationCenter|navigation/);
});

test('source has no EAS, Firebase, APNs, provider secret, or external dispatcher setup', () => {
    const files = [
        'app.json',
        'apps/mobile/src/features/push/services/pushTokenService.js',
        'apps/mobile/src/features/push/services/pushRegistrationService.js',
        'apps/mobile/src/features/push/services/pushLifecycleService.js',
    ].map(read).join('\n');
    assert.doesNotMatch(files, /eas init|eas credentials|google-services|service-account|FCM|APNs|EXPO_ACCESS_TOKEN|fetch\(/i);
});
