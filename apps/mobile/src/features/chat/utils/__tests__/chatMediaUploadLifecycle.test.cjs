const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const harness = (overrides = {}) => {
    const slots = [], effects = [], cleaned = [];
    let cursor = 0, pickerCalls = 0;
    const same = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
    const React = {
        useState: (value) => {
            const index = cursor++;
            if (!(index in slots)) slots[index] = value;
            return [slots[index], (next) => { slots[index] = next; }];
        },
        useRef: (value) => { const index = cursor++; return slots[index] ??= { current: value }; },
        useCallback: (callback, deps) => {
            const index = cursor++;
            if (!same(slots[index]?.deps, deps)) slots[index] = { callback, deps };
            return slots[index].callback;
        },
        useEffect: (callback, deps) => {
            const index = cursor++;
            if (!same(slots[index]?.deps, deps)) effects.push(() => {
                slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() };
            });
        },
    };
    const source = fs.readFileSync(path.join(__dirname, '../../hooks/useChatMediaUpload.js'), 'utf8')
        .replace(/^import.*;\r?\n/gm, '').replace(/export const /g, 'const ');
    const context = {
        ...React, Crypto: { randomUUID: () => 'message-id' },
        getChatMediaEnabled: async () => true,
        abortChatMedia: async () => {},
        cleanupChatMediaFile: (file) => { if (file) cleaned.push(file); },
        sendChatMedia: overrides.sendChatMedia ?? (async () => ({ messageId: 'message-id', conversationId: 'conversation' })),
        pickChatMedia: () => { pickerCalls++; return overrides.pickChatMedia(); },
    };
    vm.createContext(context);
    vm.runInContext(source + '\nglobalThis.hook = useChatMediaUpload;', context);
    const props = { conversationId: 'conversation', onFinalized: overrides.onFinalized ?? (() => {}) };
    const render = () => {
        cursor = 0;
        const controller = context.hook(props);
        while (effects.length) effects.shift()();
        return controller;
    };
    return { render, cleaned, pickerCalls: () => pickerCalls };
};
const ready = async (h) => { h.render(); await Promise.resolve(); return h.render(); };
const file = { uri: 'file:///cache/test.pdf', descriptor: { fileName: 'test.pdf', byteSize: 10 } };

test('native picker locks the composer immediately and prevents a second selection', async () => {
    const picker = deferred(), h = harness({ pickChatMedia: () => picker.promise });
    const pending = (await ready(h)).select();
    const busy = h.render();
    assert.equal(busy.isBusy, true);
    await busy.select();
    assert.equal(h.pickerCalls(), 1);
    picker.resolve(file); await pending;
    const selected = h.render();
    assert.equal(selected.isBusy, false);
    assert.equal(selected.selection, file);
});

test('picker failure releases the composer and permits a new selection', async () => {
    const picker = deferred(), h = harness({ pickChatMedia: () => picker.promise });
    const pending = (await ready(h)).select();
    assert.equal(h.render().isBusy, true);
    picker.reject(new Error('provider unavailable')); await pending;
    assert.equal(h.render().isBusy, false);
    assert.match(h.render().error, /Dosya seçilemedi/);
});

test('a canceled old picker cannot unlock or replace a newer picker', async () => {
    const old = deferred(), current = deferred(); let calls = 0;
    const h = harness({ pickChatMedia: () => (++calls === 1 ? old.promise : current.promise) });
    const first = (await ready(h)).select();
    h.render().reset();
    const second = h.render().select();
    old.resolve(file); await first;
    assert.equal(h.render().isBusy, true);
    assert.equal(h.render().selection, null);
    assert.deepEqual(h.cleaned, [file]);
    const next = { ...file, uri: 'file:///cache/new.pdf' };
    current.resolve(next); await second;
    assert.equal(h.render().selection, next);
    assert.equal(h.render().isBusy, false);
});

test('the composer remains locked until message reconciliation finishes', async () => {
    const finalized = deferred();
    const h = harness({ pickChatMedia: async () => file, onFinalized: () => finalized.promise });
    await (await ready(h)).select();
    const sending = h.render().send('');
    await Promise.resolve();
    assert.equal(h.render().isBusy, true);
    finalized.resolve(); assert.equal(await sending, true);
    assert.equal(h.render().isBusy, false);
    assert.equal(h.render().selection, null);
});
