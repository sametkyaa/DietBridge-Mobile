const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { INVITE_MESSAGES, normalizeInviteCode, parseInviteLink } = require('../inviteCodeContract.cjs');
const code = 'DB-ABCD-2345-EFGH-6789';
test('invite code normalizes separators/case and rejects ambiguous or malformed characters', () => {
    assert.equal(normalizeInviteCode(code.toLowerCase()), 'DBABCD2345EFGH6789');
    assert.equal(normalizeInviteCode(' DB ABCD 2345 EFGH 6789 '), 'DBABCD2345EFGH6789');
    for (const value of ['', null, code.replace('A', '0'), code.replace('A', 'I'), code + '/']) assert.equal(normalizeInviteCode(value), null);
});
test('invite links allow only canonical HTTPS and native destinations', () => {
    for (const url of [`https://app.dietbridge.com.tr/davet/${code}`, `dietbridge://davet/${code}`]) assert.equal(parseInviteLink(url), normalizeInviteCode(code));
    for (const url of [`http://app.dietbridge.com.tr/davet/${code}`, `https://evil.invalid/davet/${code}`, `https://app.dietbridge.com.tr/davet/${code}?token=secret`, `https://app.dietbridge.com.tr/davet/${code}/extra`]) assert.equal(parseInviteLink(url), null);
});
test('every deterministic failure code has a controlled Turkish message', () => {
    for (const result of ['not_found','closed','rate_limited','already_connected','has_other_dietitian','limit_reached']) assert.equal(typeof INVITE_MESSAGES[result], 'string');
});

function loadService({ userId = 'user-a', result = 'connected', error = null } = {}) {
    const calls = []; const stored = new Map();
    const supabase = {
        auth: { getSession: async () => ({data:{session:{access_token:'test-snapshot-token'}},error:null}), getUser: async () => ({ data: { user: { id: userId } }, error: null }) },
        rpc: (name, args) => ({ setHeader: (header, value) => { assert.equal(header,'Authorization'); assert.equal(value,'Bearer test-snapshot-token'); calls.push({name,args}); return Promise.resolve({data:result,error}); } }),
        functions: { invoke: async (name, args) => { calls.push({ name, args }); return { data: result, error }; } },
    };
    const storage = { getItem: async key => stored.get(key), setItem: async (key, value) => stored.set(key, value), removeItem: async key => stored.delete(key) };
    const source = fs.readFileSync(path.join(__dirname, '../../services/inviteCodeService.js'), 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/^export const /gm, 'const ');
    const functions = new Function('supabase', 'AsyncStorage', 'INVITE_MESSAGES', 'normalizeInviteCode', `${source}\nreturn {previewInviteCode,redeemInviteCode,leaveDietitian,readPendingInviteCode,storePendingInviteCode,clearPendingInviteCode};`)(supabase,storage,INVITE_MESSAGES,normalizeInviteCode);
    return { ...functions, calls, stored };
}
test('redeem calls only the authenticated RPC and does not leak backend errors', async () => {
    const service = loadService(); assert.equal(await service.redeemInviteCode(code, 'user-a'), 'connected');
    assert.deepEqual(service.calls[0], { name: 'redeem_dietitian_invite_code', args: { p_code: normalizeInviteCode(code) } });
    await assert.rejects(loadService({error:{message:'raw PostgreSQL text'}}).redeemInviteCode(code,'user-a'), { message: INVITE_MESSAGES.error });
    await assert.rejects(loadService({result:'unexpected'}).redeemInviteCode(code,'user-a'), { message: INVITE_MESSAGES.error });
});
test('a switched actor cannot submit a code or leave through a stale screen', async () => {
    const service = loadService({ userId: 'user-b' });
    await assert.rejects(service.redeemInviteCode(code,'user-a'));
    await assert.rejects(service.leaveDietitian('user-a')); assert.equal(service.calls.length,0);
});
test('preview sends only code and never invokes a relationship mutation', async () => {
    const service = loadService({result:{result:'ready',dietitian:{id:'11111111-1111-4111-8111-111111111111',display_name:'Test',professional_title:'Diyetisyen',avatar_url:null}}});
    assert.equal((await service.previewInviteCode(code,'user-a')).dietitian.name,'Test');
    assert.deepEqual(service.calls[0],{name:'preview-dietitian-invite',args:{body:{code:normalizeInviteCode(code)},headers:{Authorization:'Bearer test-snapshot-token'}}});
});
test('pending auth handoff persists only the normalized code and supports restart/clear', async () => {
    const service=loadService(); await service.storePendingInviteCode(code);
    assert.deepEqual([...service.stored.values()],[normalizeInviteCode(code)]);
    assert.equal(await service.readPendingInviteCode(),normalizeInviteCode(code));
    await service.clearPendingInviteCode(); assert.equal(await service.readPendingInviteCode(),null);
});
test('leave recognizes only server confirmed outcomes', async () => {
    for(const result of ['left','not_connected']) assert.equal(await loadService({result}).leaveDietitian('user-a'),result);
    await assert.rejects(loadService({result:'success'}).leaveDietitian('user-a'));
});
