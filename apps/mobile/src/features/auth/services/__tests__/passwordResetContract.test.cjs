'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
    PRODUCTION_PASSWORD_RESET_URL,
    resolvePasswordResetRedirectUrl,
} = require('../../utils/passwordResetPolicy.cjs');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const LOCAL_DEVELOPMENT_PASSWORD_RESET_URL = 'http://localhost:5173/reset-password';

test('production reset redirect uses the exact canonical HTTPS URL', () => {
    assert.equal(
        resolvePasswordResetRedirectUrl({
            configuredUrl: PRODUCTION_PASSWORD_RESET_URL,
            isDevelopment: false,
        }),
        'https://app.dietbridge.com.tr/reset-password',
    );
});

test('missing production reset configuration fails closed without a localhost fallback', () => {
    assert.throws(
        () => resolvePasswordResetRedirectUrl({ configuredUrl: undefined, isDevelopment: false }),
        (error) => error.code === 'PASSWORD_RESET_URL_MISSING',
    );
    assert.throws(
        () => resolvePasswordResetRedirectUrl({ configuredUrl: LOCAL_DEVELOPMENT_PASSWORD_RESET_URL, isDevelopment: false }),
        (error) => error.code === 'PASSWORD_RESET_URL_INVALID_FOR_PRODUCTION',
    );
});

test('development can use the explicit local reset URL while production cannot', () => {
    assert.equal(
        resolvePasswordResetRedirectUrl({
            configuredUrl: LOCAL_DEVELOPMENT_PASSWORD_RESET_URL,
            isDevelopment: true,
        }),
        LOCAL_DEVELOPMENT_PASSWORD_RESET_URL,
    );
});

test('Supabase reset failures cannot report success in the existing ViewModel flow', () => {
    const service = read('apps/mobile/src/features/auth/services/authService.js');
    const viewModel = read('apps/mobile/src/features/auth/viewmodels/useForgotPasswordViewModel.js');
    const submitStart = viewModel.indexOf('const handleSubmit = async () => {');
    const catchStart = viewModel.indexOf('} catch (error) {', submitStart);
    const successIndex = viewModel.indexOf('setSuccessMessage(SUCCESS_MESSAGE)', submitStart);

    assert.match(service, /resetPasswordForEmail\(email, \{[\s\S]*redirectTo: redirectUrl/);
    assert.match(service, /const \{ error \} = await supabase\.auth\.resetPasswordForEmail/);
    assert.match(service, /if \(error\) throw error/);
    assert.ok(submitStart >= 0);
    assert.ok(catchStart > submitStart);
    assert.ok(successIndex > submitStart && successIndex < catchStart);
    assert.match(viewModel.slice(catchStart), /setErrorMessage\(GENERIC_ERROR_MESSAGE\)/);
});

test('Expo/EAS production-readiness contract is explicit and does not fabricate a project id', () => {
    const app = JSON.parse(read('app.json'));
    const eas = JSON.parse(read('eas.json'));
    const plugins = app.expo.plugins;
    const imagePickerPlugin = plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === 'expo-image-picker');

    assert.equal(app.expo.name, 'DietBridge');
    assert.equal(app.expo.slug, 'dietbridge');
    assert.equal(app.expo.scheme, 'dietbridge');
    assert.equal(app.expo.version, '1.0.0');
    assert.equal(app.expo.android.package, 'com.dietbridge.app');
    assert.equal(app.expo.android.versionCode, 1);
    assert.equal(app.expo.android.adaptiveIcon.foregroundImage, './assets/meal_icon.png');
    assert.equal(app.expo.ios.bundleIdentifier, 'com.dietbridge.app');
    assert.equal(app.expo.ios.buildNumber, '1');
    assert.equal(app.expo.icon, './assets/meal_icon.png');
    assert.equal(app.expo.splash.image, './assets/meal_icon.png');
    assert.equal(imagePickerPlugin[1].microphonePermission, false);
    assert.deepEqual(Object.keys(eas.build).sort(), ['development', 'preview', 'production']);
    assert.equal(eas.build.development.distribution, 'internal');
    assert.equal(eas.build.preview.distribution, 'internal');
    assert.deepEqual(eas.build.production, {});
    assert.doesNotMatch(read('app.json'), /projectId/);
});
