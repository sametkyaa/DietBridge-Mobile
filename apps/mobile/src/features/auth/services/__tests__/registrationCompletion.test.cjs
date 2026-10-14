const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('health review discovered after legal acceptance is displayed and legal receipt is not written twice', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../viewmodels/useLegalAcceptanceViewModel.js'), 'utf8');
  const values = [];
  let index = 0;
  let legalWrites = 0;
  let accepted = 0;
  let needsReview = true;
  let receipt = { enabled: true, updated_at: '2026-10-15T10:00:00Z', storage_granted: true, sharing_granted: false };
  const context = {
    ...require('../../../../shared/utils/userError.cjs'),
    HEALTH_CONSENT_UI_ENABLED: true,
    getHealthConsent: async () => receipt,
    useState: (initial) => {
      const slot = index++;
      if (!(slot in values)) values[slot] = initial;
      return [values[slot], (next) => { values[slot] = next; }];
    },
    useRef: (initial) => {
      const slot = index++;
      if (!(slot in values)) values[slot] = { current: initial };
      return values[slot];
    },
    acceptLegalDocuments: async (acceptance) => {
      assert.equal(acceptance.termsAccepted, true);
      assert.equal(acceptance.kvkkAcknowledged, true);
      legalWrites += 1;
    },
    getCurrentClientAuthState: async () => ({ isClient: true, profile: {}, healthConsentNeedsReview: needsReview }),
    hasLegalAcceptance: () => true,
  };
  vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf('export const useLegalAcceptanceViewModel ='))
    .replace('export const useLegalAcceptanceViewModel =', 'globalThis.useViewModel ='), context);
  const render = () => { index = 0; return context.useViewModel(() => { accepted += 1; }); };
  const form = render();
  form.setTermsAccepted(true);
  form.setKvkkAcknowledged(true);
  await render().submit();
  const pending = render();
  assert.equal(pending.healthConsentNeedsReview, true);
  assert.equal(pending.legalAcceptanceRequired, false);
  assert.equal(accepted, 0);
  needsReview = false;
  await pending.submit();
  assert.equal(accepted, 0, 'A review flag alone cannot bypass the two stored health choices');
  assert.match(render().error, /DB-HEALTH-SHARING-REQUIRED/);
  receipt = { ...receipt, sharing_granted: true };
  await render().submit();
  assert.equal(legalWrites, 1);
  assert.equal(accepted, 1);
});
