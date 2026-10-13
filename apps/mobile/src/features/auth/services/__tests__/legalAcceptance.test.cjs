const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const policy = require('../../utils/legalAcceptancePolicy.cjs');
const { MOBILE_EMAIL_CONFIRMATION_URL } = require('../../utils/emailConfirmationPolicy.cjs');
const registrationPolicy = require('../../../healthConsent/services/registrationHealthConsent.cjs');

const root = path.resolve(__dirname, '../../../../../../../');
const source = fs.readFileSync(path.join(root, 'apps/mobile/src/features/auth/services/authService.js'), 'utf8');
const loadFunction = (name, next, supabase, healthConsentEnabled = false) => {
  const start = source.indexOf('export const ' + name + ' =');
  const end = source.indexOf('export const ' + next + ' =', start);
  assert(start >= 0 && end > start);
  const context = {
    supabase, ...policy, GENERIC_AUTH_ERROR_MESSAGE: 'Bir sorun oluştu. Lütfen tekrar deneyin.',
    MOBILE_EMAIL_CONFIRMATION_URL,
    HEALTH_CONSENT_UI_ENABLED: healthConsentEnabled, ...registrationPolicy,
  };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end).replace('export const', 'const') + '\nthis.result = ' + name + ';', context);
  return context.result;
};

test('unchecked, omitted, partial and truthy non-boolean acceptances cannot register', async () => {
  let calls = 0;
  const signUp = loadFunction('signUp', 'acceptLegalDocuments', { auth: { signUp: async () => { calls += 1; } } });
  for (const acceptance of [undefined, {}, { termsAccepted: true }, { kvkkAcknowledged: true },
    { termsAccepted: 'true', kvkkAcknowledged: true }, { termsAccepted: true, kvkkAcknowledged: 1 }]) {
    await assert.rejects(signUp('a@example.test', 'placeholder', 'Test Client', null, acceptance),
      (error) => error.message === policy.LEGAL_ACCEPTANCE_MESSAGE);
  }
  assert.equal(calls, 0);
});

test('registration sends explicit legal metadata only after both choices', async () => {
  let payload;
  const signUp = loadFunction('signUp', 'acceptLegalDocuments', {
    auth: { signUp: async (value) => { payload = value; return { data: { user: { id: 'test-client' } }, error: null }; } },
  });
  const result = await signUp('a@example.test', 'placeholder', ' Test Client ', ' 0500 ', {
    termsAccepted: true, kvkkAcknowledged: true,
  });
  assert.equal(result.user.id, 'test-client');
  assert.equal(payload.options.data.account_type, 'client');
  assert.equal(payload.options.data.full_name, 'Test Client');
  assert.equal(payload.options.data.phone, '0500');
  assert.equal(payload.options.data.terms_accepted, true);
  assert.equal(payload.options.data.kvkk_accepted, true);
  assert.equal(payload.options.emailRedirectTo, MOBILE_EMAIL_CONFIRMATION_URL);
  assert.equal(payload.options.data.registration_health_consent, undefined);
});

test('registration carries separate explicit health choices without requiring consent for account creation', async () => {
  for (const choice of [{ storage: true, sharing: true }, { storage: true, sharing: false }, { storage: false, sharing: false }]) {
    let payload;
    const signUp = loadFunction('signUp', 'acceptLegalDocuments', {
      auth: { signUp: async (value) => { payload = value; return { data: { user: { id: 'client' }, session: null }, error: null }; } },
    }, true);
    await signUp('a@example.test', 'placeholder', 'Client', null, {
      termsAccepted: true, kvkkAcknowledged: true, healthConsent: choice,
    });
    assert.deepEqual(JSON.parse(JSON.stringify(payload.options.data.registration_health_consent)),
      registrationPolicy.createRegistrationHealthChoice(choice));
  }
});

test('invalid health choices stop before account creation', async () => {
  const signUp = loadFunction('signUp', 'acceptLegalDocuments', {
    auth: { signUp: async () => assert.fail('Account must not be created') },
  }, true);
  for (const healthConsent of [{ storage: false, sharing: true }, { storage: 'true', sharing: false }, {}]) {
    await assert.rejects(signUp('a@example.test', 'placeholder', 'Client', null, {
      termsAccepted: true, kvkkAcknowledged: true, healthConsent,
    }));
  }
});

test('auth errors and empty registration results never report success', async () => {
  for (const response of [{ error: new Error('Network failure') }, { data: {}, error: null }]) {
    const signUp = loadFunction('signUp', 'acceptLegalDocuments', { auth: { signUp: async () => response } });
    await assert.rejects(signUp('a@example.test', 'placeholder', 'Test', null, {
      termsAccepted: true, kvkkAcknowledged: true,
    }));
  }
});

test('existing-account acceptance requires choices and confirmed server timestamps', async () => {
  let calls = 0;
  const accept = loadFunction('acceptLegalDocuments', 'signOut', {
    rpc: async (name) => {
      calls += 1;
      assert.equal(name, 'accept_legal_terms');
      return { data: [{ terms_accepted_at: '2026-10-11T10:00:00Z', kvkk_accepted_at: '2026-10-11T10:00:00Z' }], error: null };
    },
  });
  await assert.rejects(accept({ termsAccepted: true }));
  assert.equal(calls, 0);
  assert(policy.hasLegalAcceptance(await accept({ termsAccepted: true, kvkkAcknowledged: true })));
  for (const response of [{ data: [], error: null }, { data: [{ terms_accepted_at: 'time' }], error: null },
    { data: null, error: new Error('RPC failed') }]) {
    const failing = loadFunction('acceptLegalDocuments', 'signOut', { rpc: async () => response });
    await assert.rejects(failing({ termsAccepted: true, kvkkAcknowledged: true }));
  }
});
