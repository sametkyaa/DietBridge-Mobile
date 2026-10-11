const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHealthConsentClient, validateConsentState } = require('../healthConsentClient.cjs');
const state = (extra = {}) => ({ enabled: true, document_version: 'v1', notice_version: 'n1',
  processing_text: 'Specific storage purpose', sharing_text: 'Active dietitian sharing',
  storage_granted: false, sharing_granted: false, updated_at: null, ...extra });

test('dormant client does not touch the current backend', async () => {
  const client = createHealthConsentClient({ rpc: () => assert.fail('unexpected RPC') }, false);
  assert.deepEqual(await client.get(), { enabled: false });
  await client.requireStorage();
  await assert.rejects(client.set({ documentVersion: 'v1', storage: true, sharing: false }));
});
test('enabled rollout fails closed on RPC errors and malformed responses', async () => {
  for (const response of [{ error: new Error('offline') }, { data: null }, { data: { enabled: false } },
    { data: state({ storage_granted: 'true' }) }, { data: state({ sharing_granted: true }) }]) {
    const client = createHealthConsentClient({ rpc: async () => response }, true);
    await assert.rejects(client.requireStorage());
  }
});
test('ungranted consent blocks persistence; verified storage permits it without sharing', async () => {
  const client = createHealthConsentClient({ rpc: async () => ({ data: state() }) }, true);
  await assert.rejects(client.requireStorage(), { code: 'HEALTH_CONSENT_REQUIRED' });
  const allowed = createHealthConsentClient({ rpc: async () => ({ data: state({ storage_granted: true,
    updated_at: '2026-10-11T19:00:00Z' }) }) }, true);
  await allowed.requireStorage();
});
test('only explicit booleans are accepted and only the confirmed server result is successful', async () => {
  let calls = 0;
  const client = createHealthConsentClient({ rpc: async (name, args) => {
    calls += 1;
    assert.equal(name, 'set_my_health_consent');
    assert.deepEqual(args, { p_document_version: 'v1', p_storage: true, p_sharing: false });
    return { data: state({ storage_granted: true, updated_at: '2026-10-11T19:00:00Z' }) };
  } }, true);
  await assert.rejects(client.set({ documentVersion: 'v1', storage: 'true', sharing: false }));
  await assert.rejects(client.set({ documentVersion: 'v1', storage: false, sharing: true }));
  assert.equal(calls, 0);
  assert.equal((await client.set({ documentVersion: 'v1', storage: true, sharing: false })).storage_granted, true);
  const bad = createHealthConsentClient({ rpc: async () => ({ data: state() }) }, true);
  await assert.rejects(bad.set({ documentVersion: 'v1', storage: true, sharing: false }));
  assert.throws(() => validateConsentState(state({ storage_granted: true })));
});
test('a negative saved choice is not replaced with a local success or automatic regrant', async () => {
  const client = createHealthConsentClient({ rpc: async () => ({ data: state({ updated_at: '2026-10-11T19:00:00Z' }) }) }, true);
  const result = await client.set({ documentVersion: 'v1', storage: false, sharing: false });
  assert.equal(result.storage_granted, false);
  await assert.rejects(client.requireStorage());
});
test('actual weight service aborts before RPC when storage consent cannot be confirmed', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../clients/services/clientService.js'), 'utf8');
  const start = source.indexOf('export const saveCurrentWeight =');
  const end = source.indexOf('const getAvatarMimeType', start);
  let writes = 0;
  const context = { normalizeDecimal: () => 70, requireHealthStorageConsent: async () => { throw new Error('denied'); },
    supabase: { rpc: async () => { writes += 1; } } };
  vm.createContext(context);
  vm.runInContext(source.slice(start, end).replace('export const', 'const') + '\nthis.save = saveCurrentWeight;', context);
  await assert.rejects(context.save(70), /denied/);
  assert.equal(writes, 0);
});
