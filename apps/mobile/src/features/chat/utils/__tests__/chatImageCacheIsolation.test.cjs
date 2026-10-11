const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const constants = require('../../constants/chatImageConstants');
const { isValidUuid } = require('../chatMessageUtils');

const loadResolver = () => {
    const source = fs.readFileSync(path.join(__dirname, '../../services/chatImageResolver.js'), 'utf8')
        .replace(/^import[\s\S]*?;\s*/gm, '').replace(/export const /g, 'const ');
    const context = { ...constants, isValidUuid, supabase: { storage: {} } };
    vm.createContext(context);
    vm.runInContext(source + '\nglobalThis.factory = createChatImageResolver; globalThis.clearCache = clearChatImageUriCache; globalThis.subscribe = subscribeToChatImageCacheInvalidation;', context);
    return context;
};
const id = (digit) => `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;
const image = (digit = '1') => ({
    id: id(digit), messageKind: 'image', isDeleted: false,
    attachment: { id: id('2'), messageId: id(digit), bucketId: 'chat-images',
        objectPath: `pending/${id('3')}/${id(digit)}.jpg`, mimeType: 'image/jpeg',
        byteSize: 100, width: 2, height: 3, deletedAt: null },
});
const flush = () => Promise.resolve();

test('session clearing discards old responses without deleting a newer in-flight request', async () => {
    const completions = [];
    const resolver = loadResolver().factory({ storage: { from: () => ({ createSignedUrl: () => new Promise((resolve) => completions.push(resolve)) }) } });
    const old = resolver.resolve(image()); await flush();
    resolver.clear();
    const next = resolver.resolve(image()); await flush();
    completions[0]({ data: { signedUrl: 'https://signed.invalid/account-a' } });
    assert.equal((await old).uri, null);
    const sameNext = resolver.resolve(image()); await flush();
    assert.equal(completions.length, 2);
    completions[1]({ data: { signedUrl: 'https://signed.invalid/account-b' } });
    assert.equal((await next).uri, 'https://signed.invalid/account-b');
    assert.equal((await sameNext).uri, 'https://signed.invalid/account-b');
    assert.equal((await resolver.resolve(image())).uri, 'https://signed.invalid/account-b');
});

test('concurrent forced refreshes for different images do not invalidate each other', async () => {
    const resolver = loadResolver().factory({ storage: { from: () => ({ createSignedUrl: async (objectPath) => ({ data: { signedUrl: objectPath } }) }) } });
    const results = await Promise.all([resolver.refresh(image('1')), resolver.refresh(image('4'))]);
    assert.equal(results[0].status, 'ready'); assert.equal(results[1].status, 'ready');
});

test('purged and replaced requests cannot revive a removed URL', async () => {
    const completions = [];
    const resolver = loadResolver().factory({ storage: { from: () => ({ createSignedUrl: () => new Promise((resolve) => completions.push(resolve)) }) } });
    const old = resolver.resolve(image()); await flush(); resolver.purge(image());
    completions[0]({ data: { signedUrl: 'https://signed.invalid/deleted' } });
    assert.equal((await old).uri, null);
    const next = resolver.refresh(image()); await flush();
    completions[1]({ error: new Error('denied'), data: null });
    assert.equal((await next).uri, null);
});

test('failed recheck clears a formerly cached capability', async () => {
    let allowed = true, calls = 0;
    const resolver = loadResolver().factory({ storage: { from: () => ({ createSignedUrl: async () => {
        calls += 1;
        return allowed ? { data: { signedUrl: 'https://signed.invalid/allowed' } } : { error: new Error('denied') };
    } }) } });
    assert.equal((await resolver.resolve(image())).status, 'ready');
    allowed = false;
    assert.equal((await resolver.refresh(image())).uri, null);
    assert.equal((await resolver.resolve(image())).uri, null);
    assert.equal(calls, 3);
});

test('consent/session invalidation notifies mounted consumers and unsubscribe detaches', () => {
    const { subscribe, clearCache } = loadResolver(); const reasons = [];
    const stop = subscribe((reason) => reasons.push(reason));
    clearCache('consent'); clearCache('session'); stop(); clearCache('consent');
    assert.deepEqual(reasons, ['consent', 'session']);
});

test('saving consent invalidates image state even when the RPC outcome is uncertain', async () => {
    const source = fs.readFileSync(path.join(__dirname, '../../../healthConsent/services/healthConsentService.js'), 'utf8');
    const start = source.indexOf('export const setHealthConsent =');
    const end = source.indexOf('export const requireHealthStorageConsent', start);
    const reasons = [];
    const context = { client: { set: async () => { throw new Error('offline'); } }, clearChatImageUriCache: (reason) => reasons.push(reason) };
    vm.createContext(context);
    vm.runInContext(source.slice(start, end).replace('export const setHealthConsent =', 'globalThis.setConsent ='), context);
    await assert.rejects(context.setConsent({ storage: false, sharing: false }));
    assert.deepEqual(reasons, ['consent']);
});
