'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    NATIVE_PASSWORD_RECOVERY_URL,
    PASSWORD_RECOVERY_INVALID_MESSAGE,
    isNativePasswordRecoveryDestination,
    parsePasswordRecoveryUrl,
} = require('../../utils/passwordRecoveryContract.cjs');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('native recovery parser accepts the Supabase implicit hash payload', () => {
    const result = parsePasswordRecoveryUrl(
        `${NATIVE_PASSWORD_RECOVERY_URL}#access_token=fake-access-token&refresh_token=fake-refresh-token&type=recovery`,
    );

    assert.deepEqual(result, {
        ok: true,
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        type: 'recovery',
    });
    assert.equal(isNativePasswordRecoveryDestination(NATIVE_PASSWORD_RECOVERY_URL), true);
});

test('native recovery parser also accepts a query payload without changing the route contract', () => {
    const result = parsePasswordRecoveryUrl(
        `${NATIVE_PASSWORD_RECOVERY_URL}?access_token=fake-access-token&refresh_token=fake-refresh-token&type=recovery`,
    );

    assert.equal(result.ok, true);
    assert.equal(result.accessToken, 'fake-access-token');
    assert.equal(result.refreshToken, 'fake-refresh-token');
    assert.equal(result.type, 'recovery');
});

test('native recovery parser rejects unrelated, malformed, empty, wrong-type, and error links', () => {
    const invalidLinks = [
        'https://example.test/reset-password#access_token=fake-access-token&refresh_token=fake-refresh-token&type=recovery',
        'dietbridge://other#access_token=fake-access-token&refresh_token=fake-refresh-token&type=recovery',
        `${NATIVE_PASSWORD_RECOVERY_URL}#access_token=fake-access-token&refresh_token=&type=recovery`,
        `${NATIVE_PASSWORD_RECOVERY_URL}#access_token=fake-access-token&refresh_token=fake-refresh-token&type=signup`,
        `${NATIVE_PASSWORD_RECOVERY_URL}#access_token=%ZZ&refresh_token=fake-refresh-token&type=recovery`,
        `${NATIVE_PASSWORD_RECOVERY_URL}#error=access_denied&error_description=expired&type=recovery`,
        `${NATIVE_PASSWORD_RECOVERY_URL}#access_token=fake-access-token&type=recovery`,
    ];

    for (const link of invalidLinks) {
        const result = parsePasswordRecoveryUrl(link);
        assert.equal(result.ok, false);
        assert.equal(result.message, PASSWORD_RECOVERY_INVALID_MESSAGE);
        assert.equal(Object.prototype.hasOwnProperty.call(result, 'accessToken'), false);
        assert.equal(Object.prototype.hasOwnProperty.call(result, 'refreshToken'), false);
    }

    assert.equal(isNativePasswordRecoveryDestination('dietbridge:/reset-password'), false);
});

test('auth service establishes and validates a recovery session without exposing token state', () => {
    const service = read('apps/mobile/src/features/auth/services/authService.js');
    const client = read('apps/mobile/src/lib/supabaseClient.js');
    const store = read('apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js');

    assert.match(service, /parsePasswordRecoveryUrl\(url\)/);
    assert.match(
        service,
        /supabase\.auth\.setSession\(\{\s*access_token:\s*parsed\.accessToken,\s*refresh_token:\s*parsed\.refreshToken,\s*\}\)/,
    );
    assert.match(service, /const session = data\?\.session/);
    assert.match(service, /!session\?\.user\?\.id/);
    assert.match(service, /activePasswordRecoveryUserId = session\.user\.id/);
    assert.match(service, /supabase\.auth\.signOut\(\{ scope: 'local' \}\)/);
    assert.match(service, /savePasswordRecoveryState\(session\.user\.id\)/);
    assert.match(service, /restorePasswordRecoverySession/);
    assert.doesNotMatch(service, /AsyncStorage/);
    assert.doesNotMatch(service, /console\.(log|warn|error)[^\n]*(access|refresh|token)/i);
    assert.match(client, /persistSession:\s*true/);
    assert.match(client, /autoRefreshToken:\s*true/);
    assert.match(client, /detectSessionInUrl:\s*false/);
    assert.doesNotMatch(client, /flowType:\s*['"]pkce['"]/i);
    assert.match(store, /AsyncStorage\.setItem/);
    assert.match(store, /AsyncStorage\.getItem/);
    assert.match(store, /AsyncStorage\.removeItem/);
    assert.match(store, /version: PASSWORD_RECOVERY_STATE_VERSION/);
    assert.match(store, /active: true/);
    assert.match(store, /userId/);
    assert.doesNotMatch(store, /access_token|refresh_token|reset-password|recovery_url/i);
});

test('password update is recovery-session scoped and clears through the existing local sign-out path', () => {
    const service = read('apps/mobile/src/features/auth/services/authService.js');

    assert.match(service, /supabase\.auth\.getSession\(\)/);
    assert.match(service, /session\.user\.id !== activePasswordRecoveryUserId/);
    assert.match(service, /supabase\.auth\.updateUser\(\{ password: newPassword \}\)/);
    assert.match(service, /export const signOut = async \(\) =>/);
    assert.match(service, /await safeSignOut\(\);/);
});

test('persisted recovery restoration distinguishes normal, matching, missing, and mismatched sessions', () => {
    const service = read('apps/mobile/src/features/auth/services/authService.js');
    const app = read('App.js');

    assert.match(service, /let storedState;/);
    assert.match(service, /getPasswordRecoveryState\(\{[\s\S]*isCurrent:/);
    assert.match(service, /if \(!storedState\?\.ok\)/);
    assert.match(service, /if \(!storedState\.state\)/);
    assert.match(service, /return \{ ok: true, status: 'none' \}/);
    assert.match(service, /return \{ ok: true, status: 'active' \}/);
    assert.match(service, /PASSWORD_RECOVERY_SESSION_MISSING/);
    assert.match(service, /PASSWORD_RECOVERY_SESSION_MISMATCH/);
    assert.match(service, /clearPasswordRecoveryState\(\)/);
    assert.match(service, /await safeSignOut\(\)/);
    const store = read('apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js');
    assert.match(store, /JSON\.parse/);
    assert.match(store, /isValidStoredState/);
    assert.match(store, /USER_ID_PATTERN/);
    assert.match(store, /PASSWORD_RECOVERY_STATE_MALFORMED/);

    const restoreIndex = app.indexOf('restorePasswordRecoverySession()');
    const normalAuthIndex = app.indexOf('getCurrentClientAuthState()');
    assert.ok(restoreIndex >= 0);
    assert.ok(normalAuthIndex > restoreIndex);
    assert.match(app, /recoveryRestoration\.status === 'active'/);
    assert.match(app, /recoveryModeRef\.current = true/);
    assert.match(app, /initialRouteName=\{isRecoveryFlow \? 'ResetPassword' : authEntryRoute\}/);
});

test('recovery cleanup stays fail-closed until both marker and local session cleanup succeed', () => {
    const service = read('apps/mobile/src/features/auth/services/authService.js');
    const app = read('App.js');
    const store = read('apps/mobile/src/features/auth/services/passwordRecoveryStateStore.js');

    assert.match(service, /activePasswordRecoveryUserId = null/);
    assert.match(service, /markerCleared: Boolean\(markerResult\?\.ok\)/);
    assert.match(service, /sessionCleared: !signOutError/);
    assert.match(app, /cleanupResult\?\.ok === false/);
    assert.match(app, /status: 'invalid'/);
    assert.doesNotMatch(store, /JSON\.stringify\([\s\S]*(access_token|refresh_token)/i);
});

test('App handles the same recovery URL path on cold start and runtime events with stale guards', () => {
    const app = read('App.js');

    assert.match(app, /Linking\.getInitialURL\(\)/);
    assert.match(app, /Linking\.addEventListener\('url'/);
    assert.match(app, /const processRecoveryUrl = async \(url\) =>/);
    assert.match(app, /establishPasswordRecoverySession\(url\)/);
    assert.match(app, /recoveryOperationRef/);
    assert.match(app, /operationVersion !== recoveryOperationRef\.current/);
    assert.match(app, /event === 'PASSWORD_RECOVERY'/);
    assert.match(app, /recoveryState\.status === 'idle'/);
    assert.match(app, /<RootNavigator \/>/);
    assert.match(app, /<AuthNavigator/);
});

test('Auth navigation keeps ResetPassword outside the client root and includes safe invalid-link actions', () => {
    const navigator = read('apps/mobile/src/navigation/AuthNavigator.js');
    const screen = read('apps/mobile/src/features/auth/screens/ResetPasswordScreen.js');
    const viewModel = read('apps/mobile/src/features/auth/viewmodels/useResetPasswordViewModel.js');

    assert.match(navigator, /initialRouteName=\{initialRouteName\}/);
    assert.match(navigator, /<Stack\.Screen name="ResetPassword">/);
    assert.match(navigator, /ResetPasswordScreen/);
    assert.match(screen, /Yeni şifre/);
    assert.match(screen, /Yeni şifre tekrar/);
    assert.match(screen, /Bağlantı kullanılamıyor/);
    assert.match(screen, /Yeni bağlantı iste/);
    assert.match(screen, /Giriş ekranına dön/);
    assert.doesNotMatch(screen, /access_token|refresh_token/);
    assert.match(viewModel, /if \(!newPassword\)/);
    assert.match(viewModel, /if \(!confirmPassword\)/);
    assert.match(viewModel, /newPassword !== confirmPassword/);
    assert.match(viewModel, /updatePassword\(newPassword\)/);
});
