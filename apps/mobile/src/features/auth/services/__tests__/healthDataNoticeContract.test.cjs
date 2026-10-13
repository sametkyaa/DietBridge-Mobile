const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('health-data notice describes storage, authorized access and non-clinical platform role', () => {
  const notice = read('apps/mobile/src/shared/components/legal/HealthDataNotice.js');
  assert.match(notice, /sağlık ve beslenme bilgileri hesabında saklanır/);
  assert.match(notice, /aktif ve yetkili bir bağlantı kapsamında gösterilir/);
  assert.match(notice, /bağımsız teşhis veya tedavi önerisi üretmez/);
  assert.match(notice, /openExternalLink\(KVKK_URL\)/);
  assert.doesNotMatch(notice, /rıza veriyorum|onaylıyorum|consentAccepted|setConsent/);
});

test('health notice and choices are available at registration and Settings instead of onboarding and profile', () => {
  const onboarding = read('apps/mobile/src/features/onboarding/screens/OnboardingSetupScreen.js');
  const profile = read('apps/mobile/src/features/clients/screens/ProfileScreen.js');
  const registration = read('apps/mobile/src/features/auth/components/RegisterView.js');
  const settings = read('apps/mobile/src/features/clients/screens/SettingsScreen.js');
  assert.doesNotMatch(onboarding, /HealthDataNotice|HealthConsentPanel/);
  assert.doesNotMatch(profile, /HealthDataNotice|HealthConsentPanel/);
  assert.match(registration, /<HealthDataNotice \/>[\s\S]+?<LegalAcceptanceFields[\s\S]+?<RegistrationHealthConsentFields/);
  assert.match(settings, /KVKK ve sağlık verisi[\s\S]+?<HealthDataNotice \/>[\s\S]+?<HealthConsentPanel/);
});
