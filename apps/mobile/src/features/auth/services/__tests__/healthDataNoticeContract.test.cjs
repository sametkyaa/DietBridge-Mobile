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

test('notice is accessible before onboarding profile data entry and on profile', () => {
  const onboarding = read('apps/mobile/src/features/onboarding/screens/OnboardingSetupScreen.js');
  const profile = read('apps/mobile/src/features/clients/screens/ProfileScreen.js');
  assert.match(onboarding, /stepKey="goal"[\s\S]+?<HealthDataNotice \/>/);
  assert.match(profile, /<HealthDataNotice \/>[\s\S]+?title="Sağlık bilgileri"/);
});
