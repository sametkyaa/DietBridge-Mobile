const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const read = (relativePath) => fs.readFileSync(path.resolve(process.cwd(), relativePath), 'utf8');

test('registration exposes legal links without changing the form contract', () => {
    const registerView = read('apps/mobile/src/features/auth/components/RegisterView.js');

    assert.match(registerView, /LegalLinks/);
    assert.match(registerView, /Kayıt ol/);
    assert.match(registerView, /onSubmit/);
    assert.match(registerView, /onLogin/);
    assert.doesNotMatch(registerView, /href\s*=\s*['"]#/);
});

test('Support exposes a visible email action and compact legal access', () => {
    const supportScreen = read('apps/mobile/src/features/clients/screens/SupportScreen.js');

    assert.match(supportScreen, /SUPPORT_EMAIL/);
    assert.match(supportScreen, /E-posta Gönder/);
    assert.match(supportScreen, /openSupportEmail/);
    assert.match(supportScreen, /LegalLinks includeKvkk/);
    assert.doesNotMatch(supportScreen, /health|sağlık.*body|body.*sağlık/i);
});

test('linking implementation handles platform failure without arbitrary URL access', () => {
    const linking = read('apps/mobile/src/shared/utils/externalLinking.js');

    assert.match(linking, /openExternalTarget/);
    assert.match(linking, /Alert\.alert/);
    assert.match(linking, /Linking\.canOpenURL/);
    assert.match(linking, /Linking\.openURL/);
});
