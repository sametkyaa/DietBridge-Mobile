const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REGISTRATION_HEALTH_DOCUMENT: document, createRegistrationHealthChoice, createRegistrationHealthConsent: createConsent,
} = require('../registrationHealthConsent.cjs');
const createRegistrationHealthConsent = (dependencies) => createConsent({ getSessionUserId: async () => 'client-a', ...dependencies });

const state = (extra = {}) => ({ enabled: true, document_version: document.documentVersion,
  notice_version: document.noticeVersion, processing_text: document.processingText, sharing_text: document.sharingText,
  storage_granted: false, sharing_granted: false, updated_at: null, ...extra });
const user = (choice = { storage: true, sharing: true }) => ({ id: 'client-a',
  user_metadata: { registration_health_consent: createRegistrationHealthChoice(choice) } });
const receipt = (choice) => state({ storage_granted: choice.storage, sharing_granted: choice.sharing,
  updated_at: '2026-10-13T10:00:00Z' });

test('disabled rollout and old accounts do not query or infer health consent from KVKK', async () => {
  const unused = () => assert.fail('Unexpected consent call');
  assert.deepEqual(await createRegistrationHealthConsent({ enabled: false, getConsent: unused }).reconcile(user()), { needsReview: false });
  assert.deepEqual(await createRegistrationHealthConsent({ enabled: true, getConsent: unused }).reconcile({ id: 'old',
    user_metadata: { kvkk_accepted: true } }), { needsReview: false });
});

test('email-confirmed session records exact choices through the authenticated RPC including refusal', async () => {
  for (const choice of [{ storage: true, sharing: true }, { storage: true, sharing: false }, { storage: false, sharing: false }]) {
    let saved;
    const service = createRegistrationHealthConsent({ enabled: true, getConsent: async () => state(),
      setConsent: async (value) => { saved = value; return receipt(value); } });
    assert.deepEqual(await service.reconcile(user(choice)), { needsReview: false });
    assert.deepEqual(saved, { documentVersion: document.documentVersion, ...choice });
  }
});

test('saved grants and withdrawals are never overwritten on subsequent login', async () => {
  for (const storage of [true, false]) {
    const service = createRegistrationHealthConsent({ enabled: true,
      getConsent: async () => receipt({ storage, sharing: false }), setConsent: () => assert.fail('Must not replay') });
    assert.deepEqual(await service.reconcile(user()), { needsReview: false });
  }
});

test('changed document, notice or wording requires review before any write', async () => {
  for (const extra of [{ document_version: 'v2' }, { notice_version: 'n2' }, { processing_text: 'Updated' }, { sharing_text: 'Updated' }]) {
    const service = createRegistrationHealthConsent({ enabled: true, getConsent: async () => state(extra),
      setConsent: () => assert.fail('Must not accept unseen text') });
    assert.deepEqual(await service.reconcile(user()), { needsReview: true });
  }
});

test('network errors and absent or mismatched receipts keep the completion gate closed', async () => {
  for (const setConsent of [async () => { throw new Error('offline'); }, async () => null,
    async () => state(), async () => receipt({ storage: false, sharing: false })]) {
    const service = createRegistrationHealthConsent({ enabled: true, getConsent: async () => state(), setConsent });
    assert.deepEqual(await service.reconcile(user()), { needsReview: true });
  }
  const service = createRegistrationHealthConsent({ enabled: true, getConsent: async () => { throw new Error('offline'); } });
  assert.deepEqual(await service.reconcile(user()), { needsReview: true });
});

test('simultaneous auth lifecycle events share one write and remain isolated by user', async () => {
  const calls = [];
  const service = createRegistrationHealthConsent({ enabled: true, getConsent: async () => state(),
    setConsent: async (choice) => { calls.push(choice); return receipt(choice); } });
  await Promise.all([service.reconcile(user()), service.reconcile(user())]);
  assert.equal(calls.length, 1);
  assert.deepEqual(await service.reconcile({ ...user(), id: 'client-b' }), { needsReview: true });
  assert.equal(calls.length, 1);
});

test('a session switch while reading consent prevents registration choices being written to another account', async () => {
  let currentUser = 'client-a';
  const service = createRegistrationHealthConsent({ enabled: true, getSessionUserId: async () => currentUser,
    getConsent: async () => { currentUser = 'client-b'; return state(); },
    setConsent: () => assert.fail('Must not apply another account choices') });
  assert.deepEqual(await service.reconcile(user()), { needsReview: true });
});
