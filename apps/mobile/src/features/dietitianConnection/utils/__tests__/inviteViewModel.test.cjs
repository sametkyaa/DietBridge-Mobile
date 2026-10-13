const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const contract = require('../inviteCodeContract.cjs');
const code='DB-ABCD-2345-EFGH-6789';
const profile={id:'dietitian-a',name:'Test'};
const deferred = () => { let resolve; const promise = new Promise(done => {resolve=done;}); return {promise,resolve}; };
function harness(services) {
    const values=[]; const effects=[]; let index=0; let refreshes=0; let completed=0;
    const hooks={
        useState: initial => {const slot=index++; if(!(slot in values)) values[slot]=initial; return [values[slot],value=>{values[slot]=typeof value==='function'?value(values[slot]):value;}];},
        useRef: initial => {const slot=index++; if(!(slot in values)) values[slot]={current:initial}; return values[slot];},
        useCallback: fn => fn,
        useEffect: (fn,deps) => {const slot=index++; if(!effects[slot] || deps.some((value,i)=>value!==effects[slot].deps[i])) {effects[slot]?.cleanup?.(); effects[slot]={deps,cleanup:fn()};}},
    };
    const source=fs.readFileSync(path.join(__dirname,'../../viewmodels/useDietitianInviteViewModel.js'),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export function','function');
    const fn=new Function('useCallback','useEffect','useRef','useState','previewInviteCode','redeemInviteCode','INVITE_MESSAGES','normalizeInviteCode','formatInviteCodeInput','useDietitianConnection',`${source}; return useDietitianInviteViewModel;`)(hooks.useCallback,hooks.useEffect,hooks.useRef,hooks.useState,services.preview,services.redeem,contract.INVITE_MESSAGES,contract.normalizeInviteCode,contract.formatInviteCodeInput,()=>({refreshConnectionStatus:async()=>{refreshes++;}}));
    return {render:(props={})=>{index=0; return fn({userId:'user-a',onComplete:async()=>{completed++;},...props});},unmount:()=>effects.forEach(effect=>effect?.cleanup?.()),get refreshes(){return refreshes;},get completed(){return completed;}};
}
test('preview result never auto saves and explicit confirm is submitted once',async()=>{
    let writes=0; const pending=deferred();
    const h=harness({preview:async()=>({result:'ready',dietitian:profile}),redeem:async()=>{writes++;return pending.promise;}});
    h.render().changeCode(code); await h.render().preview(); assert.equal(writes,0);
    const vm=h.render(); const first=vm.redeem(); await vm.redeem(); assert.equal(writes,1);
    pending.resolve('connected');await first;assert.equal(h.refreshes,1);assert.equal(h.completed,1);assert.equal(h.render().completed,true);
});

test('a short code is formatted while typing and still requires explicit connection approval', async () => {
    let writes = 0;
    const h = harness({preview:async value => {assert.equal(value,'ABCD2345');return {result:'ready',dietitian:profile};},redeem:async value => {assert.equal(value,'ABCD-2345');writes++;return 'connected';}});
    h.render().changeCode('abcd2345');
    assert.equal(h.render().code,'ABCD-2345');
    await h.render().preview();
    assert.equal(h.render().profile,profile);
    assert.equal(writes,0);
    await h.render().redeem();
    assert.equal(writes,1);
    assert.equal(h.render().completed,true);
});
test('changed code and unmounted screen discard stale preview profiles',async()=>{
    const pending=deferred();const h=harness({preview:()=>pending.promise,redeem:async()=>assert.fail('no writes')});
    h.render().changeCode(code);const loading=h.render().preview();h.render().changeCode('invalid');pending.resolve({result:'ready',dietitian:profile});await loading;assert.equal(h.render().profile,null);
    const next=deferred();const h2=harness({preview:()=>next.promise,redeem:async()=>assert.fail('no writes')});h2.render().changeCode(code);const request=h2.render().preview();h2.unmount();next.resolve({result:'ready',dietitian:profile});await request;assert.equal(h2.render().profile,null);
});
test('failed redeem never reports success or refreshes protected state',async()=>{
    const h=harness({preview:async()=>({result:'ready',dietitian:profile}),redeem:async()=>{throw new Error('secret backend detail');}});
    h.render().changeCode(code);await h.render().preview();await h.render().redeem();assert.equal(h.render().completed,false);assert.equal(h.completed,0);assert.equal(h.refreshes,0);assert.equal(h.render().message,contract.INVITE_MESSAGES.error);
});

test('closed or rotated-away invites never expose a connectable profile or submit a connection', async () => {
    for (const result of ['closed', 'not_found', 'rate_limited']) {
        const h = harness({ preview: async () => ({ result }), redeem: async () => assert.fail('rejected invite must not be redeemed') });
        h.render().changeCode(code);
        await h.render().preview();
        assert.equal(h.render().profile, null);
        assert.equal(h.render().message, contract.INVITE_MESSAGES[result]);
        await h.render().redeem();
        assert.equal(h.completed, 0);
        assert.equal(h.refreshes, 0);
        assert.equal(h.render().completed, false);
    }
});

test('a malformed invite is rejected before preview or redemption', async () => {
    const h = harness({ preview: async () => assert.fail('invalid code must not reach preview'), redeem: async () => assert.fail('invalid code must not reach redeem') });
    h.render().changeCode('../../invalid');
    await h.render().preview();
    assert.equal(h.render().message, contract.INVITE_MESSAGES.not_found);
    await h.render().redeem();
    assert.equal(h.completed, 0);
});

test('a link supplied after login previews once and still requires explicit confirmation', async () => {
    let previews = 0;
    let writes = 0;
    const h = harness({ preview: async () => { previews++; return { result: 'ready', dietitian: profile }; }, redeem: async () => { writes++; return 'connected'; } });
    h.render({ initialCode: code });
    await new Promise(setImmediate);
    const vm = h.render({ initialCode: code });
    assert.equal(previews, 1);
    assert.equal(vm.profile, profile);
    assert.equal(writes, 0);
    await vm.redeem();
    assert.equal(writes, 1);
    assert.equal(h.completed, 1);
});
