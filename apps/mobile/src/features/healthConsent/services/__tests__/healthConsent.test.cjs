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

test('sending to a dietitian needs sharing; own tracking only needs storage', async () => {
  const client = createHealthConsentClient({ rpc: async () => ({ data: state({ storage_granted: true,
    updated_at: '2026-10-11T19:00:00Z' }) }) }, true);
  await client.requireStorage();
  await assert.rejects(client.requireSharing(), { code: 'HEALTH_CONSENT_REQUIRED' });
  const allowed = createHealthConsentClient({ rpc: async () => ({ data: state({ storage_granted: true,
    sharing_granted: true, updated_at: '2026-10-11T19:00:00Z' }) }) }, true);
  await allowed.requireSharing();
});

test('actual meal completion aborts before RPC when consent is denied', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../meals/services/mealService.js'), 'utf8');
  const start = source.indexOf('export const updateMealCompletion =');
  let writes = 0;
  const context = { UUID_PATTERN: /^[a-f0-9-]{36}$/, requireHealthStorageConsent: async () => {
    const error = new Error('consent denied'); error.code = 'HEALTH_CONSENT_REQUIRED'; throw error;
  }, supabase: { rpc: async () => { writes += 1; } }, __DEV__: false };
  vm.createContext(context);
  vm.runInContext(source.slice(start).replace('export const', 'const') + '\nthis.save = updateMealCompletion;', context);
  await assert.rejects(context.save('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true), { code: 'HEALTH_CONSENT_REQUIRED' });
  assert.equal(writes, 0);
});

test('actual photo service stops before canonicalization and upload on denied consent', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../meals/services/mealCompletionPhotoService.js'), 'utf8');
  const start = source.indexOf('export const completeMealWithPhoto =');
  const end = source.indexOf('export default', start);
  let uploads = 0;
  const context = { requireHealthStorageConsent: async () => { throw new Error('consent denied'); },
    uploadAndCompleteMealWithPhoto: async () => { uploads += 1; } };
  vm.createContext(context);
  vm.runInContext(source.slice(start,end).replace('export const', 'const') + '\nthis.save = completeMealWithPhoto;', context);
  await assert.rejects(context.save('meal', { uri: 'local' }), /consent denied/);
  assert.equal(uploads, 0);
});

test('actual change request stops before the database write without sharing', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../meals/services/mealChangeRequestService.js'), 'utf8');
  const start = source.indexOf('export const submitMealChangeRequest =');
  let writes = 0;
  const context = { requireHealthSharingConsent: async () => { throw new Error('sharing denied'); },
    getActiveDietitianConnection: async () => ({ dietitian_id: 'fixture' }),
    supabase: { auth: { getUser: async () => ({ data: { user: { id: 'client' } } }) },
      from: () => { writes += 1; assert.fail('must not write'); } } };
  vm.createContext(context);
  vm.runInContext(source.slice(start).replace('export const', 'const') + '\nthis.save = submitMealChangeRequest;', context);
  await assert.rejects(context.save({ plan_date: '2026-10-11', meal_slot: 'lunch' }), /sharing denied/);
  assert.equal(writes, 0);
});

test('actual chat sending stops before RPC and keeps the consent error', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../chat/services/chatService.js'), 'utf8');
  const start = source.indexOf('export const sendChatMessage =');
  const end = source.indexOf('export const fetchChatReadStates =', start);
  let writes = 0;
  const context = { assertUuid: (v) => v, assertOptionalUuid: (v) => v, assertChatBody: (v) => v,
    requireHealthSharingConsent: async () => { const e = new Error('sharing denied'); e.code = 'HEALTH_CONSENT_REQUIRED'; throw e; },
    supabase: { rpc: () => { writes += 1; assert.fail('unexpected send'); } } };
  vm.createContext(context);
  vm.runInContext(source.slice(start,end).replace('export const','const') + '\nthis.send = sendChatMessage;', context);
  await assert.rejects(context.send({ relationId: 'relation', clientMessageId: 'message', body: 'fixture' }), { code: 'HEALTH_CONSENT_REQUIRED' });
  assert.equal(writes, 0);
});

test('each actual chat image stage stops before RPC, Storage or validation when sharing is denied', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../chat/services/chatImageService.js'), 'utf8');
  for (const [name,args] of [
    ['createChatImageUploadIntent',[{ conversationId: 'id', clientMessageId: 'id' }]],
    ['uploadCanonicalChatImage',[{},{}]], ['validateChatImageUpload',['id']], ['finalizeChatImageMessage',['id','fixture']],
  ]) {
    const start = source.indexOf(`export const ${name} =`);
    const end = source.indexOf('\n};',start)+4;
    let io = 0;
    const unexpected = () => { io += 1; assert.fail('unexpected image IO'); };
    const context = { isValidUuid: () => true, assertUploadTarget: () => {}, normalizeChatImageCaption: (v) => v,
      requireHealthSharingConsent: async () => { const e = new Error('sharing denied'); e.code = 'HEALTH_CONSENT_REQUIRED'; throw e; },
      supabase: { rpc: unexpected, storage: { from: unexpected }, functions: { invoke: unexpected } } };
    vm.createContext(context);
    vm.runInContext(source.slice(start,end).replace('export const','const') + `\nthis.stage = ${name};`,context);
    await assert.rejects(context.stage(...args), { code: 'HEALTH_CONSENT_REQUIRED' });
    assert.equal(io,0,name);
  }
});


test('consent failures carry the safe message consumed by the chat ViewModel', async () => {
  const client = createHealthConsentClient({ rpc: async () => ({ data: state() }) }, true);
  await assert.rejects(client.requireSharing(), (error) => {
    assert.equal(error.code, 'HEALTH_CONSENT_REQUIRED');
    assert.equal(error.userMessage, error.message);
    assert.match(error.userMessage, /diyetisyenine/);
    return true;
  });
  assert.throws(() => validateConsentState(null), { code: 'HEALTH_CONSENT_UNAVAILABLE' });
});

test('chat image UI retains the safe consent failure and correct retry decision', () => {
  const { toChatImageUploadFailure } = require('../../../chat/utils/chatImageError');
  const denied = toChatImageUploadFailure({ code: 'HEALTH_CONSENT_REQUIRED', message: 'raw fixture' });
  assert.equal(denied.code, 'health_consent_required');
  assert.equal(denied.retryable, false);
  assert.match(denied.userMessage, /paylaşım tercihini/);
  const unavailable = toChatImageUploadFailure({ code: 'HEALTH_CONSENT_UNAVAILABLE', message: 'raw fixture' });
  assert.equal(unavailable.code, 'health_consent_unavailable');
  assert.equal(unavailable.retryable, true);
  assert.doesNotMatch(unavailable.userMessage, /raw fixture/);
});
