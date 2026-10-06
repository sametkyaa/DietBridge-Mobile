'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (...parts) => fs.readFileSync(path.join(__dirname, '..', '..', ...parts), 'utf8');

test('sign-up requires explicit Terms and KVKK consent and sends it as metadata', () => {
    const service = read('services', 'authService.js');
    assert.match(service, /consent\?\.termsAccepted !== true \|\| consent\?\.kvkkAccepted !== true/);
    assert.match(service, /terms_accepted: true,\s*kvkk_accepted: true/);
    assert.doesNotMatch(service, /terms_accepted_at|kvkk_accepted_at/);
});

test('register screen shows unchecked consent rows that block submission', () => {
    const viewModel = read('viewmodels', 'useAuthViewModel.js');
    const view = read('components', 'RegisterView.js');
    assert.match(viewModel, /const \[termsAccepted, setTermsAccepted\] = useState\(false\)/);
    assert.match(viewModel, /const \[kvkkAccepted, setKvkkAccepted\] = useState\(false\)/);
    assert.match(viewModel, /if \(!termsAccepted\)[\s\S]*if \(!kvkkAccepted\)[\s\S]*await signUp\(email, password, fullName, phone, \{ termsAccepted, kvkkAccepted \}\)/);
    assert.match(view, /documentUrl=\{TERMS_URL\}/);
    assert.match(view, /documentUrl=\{KVKK_URL\}/);
    const checkbox = read('components', 'LegalConsentCheckbox.js');
    assert.match(checkbox, /accessibilityRole="checkbox"/);
    assert.match(checkbox, /accessibilityState=\{\{ checked, disabled \}\}/);
});
