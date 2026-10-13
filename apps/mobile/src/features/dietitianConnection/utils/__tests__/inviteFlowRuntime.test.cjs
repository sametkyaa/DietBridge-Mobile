const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const contract = require('../inviteCodeContract.cjs');

const firstCode = 'DBABCD2345EFGH6789';
const secondCode = 'DBABCD2345EFGH6788';
const urlFor = (code) => `https://app.dietbridge.com.tr/davet/${code}`;
const flush = () => new Promise(setImmediate);
const deferred = () => {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
};

function harness({ initialUrl = null, savedCode = null } = {}) {
    const state = [];
    const effects = [];
    const storageCalls = [];
    let cursor = 0;
    let stored = savedCode;
    let listener = null;
    const Sheet = () => null;
    const react = {
        createContext: () => ({ Provider: () => null }),
        useContext: (context) => context,
        useState: (initial) => {
            const slot = cursor++;
            if (!(slot in state)) state[slot] = initial;
            return [state[slot], (value) => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
        },
        useRef: (initial) => {
            const slot = cursor++;
            if (!(slot in state)) state[slot] = { current: initial };
            return state[slot];
        },
        useCallback: (fn) => { cursor++; return fn; },
        useEffect: (fn, deps) => {
            const slot = cursor++;
            if (!effects[slot] || deps.some((value, i) => value !== effects[slot].deps[i])) {
                effects[slot]?.cleanup?.();
                effects[slot] = { deps, cleanup: fn() };
            }
        },
        createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    };
    const services = {
        readPendingInviteCode: async () => stored,
        storePendingInviteCode: async (code) => { storageCalls.push(['store', code]); stored = code; },
        clearPendingInviteCode: async () => { storageCalls.push(['clear']); stored = null; },
    };
    const linking = {
        getInitialURL: async () => initialUrl,
        addEventListener: (_event, handler) => {
            listener = handler;
            return { remove: () => { listener = null; } };
        },
    };
    const context = {
        exports: {},
        require: (name) => {
            if (name === 'react') return react;
            if (name === 'react-native') return { Linking: linking };
            if (name.endsWith('/inviteCodeService')) return services;
            if (name.endsWith('/inviteCodeContract.cjs')) return contract;
            if (name.endsWith('/InviteCodeSheet')) return { __esModule: true, default: Sheet };
            throw new Error(`Unexpected module: ${name}`);
        },
    };
    vm.createContext(context);
    const source = fs.readFileSync(path.join(__dirname, '../../context/InviteFlowContext.js'), 'utf8');
    vm.runInContext(ts.transpileModule(source, { fileName: 'InviteFlowContext.jsx', compilerOptions: {
        module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true,
    } }).outputText, context);
    return {
        render: (userId = null) => {
            cursor = 0;
            const tree = context.exports.InviteFlowProvider({ userId, children: 'app' });
            return { flow: tree.props.value, sheet: tree.props.children.find((child) => child?.type === Sheet) ?? null };
        },
        send: (url) => listener?.({ url }),
        unmount: () => effects.forEach((effect) => effect?.cleanup?.()),
        storageCalls,
        get stored() { return stored; },
    };
}

test('cold invite is preserved before login and only opens the sheet after authenticated routes become available', async () => {
    const h = harness({ initialUrl: urlFor(firstCode) });
    assert.equal(h.render().sheet, null);
    await flush();
    assert.equal(h.stored, firstCode);
    assert.equal(h.render().sheet, null);
    const signedIn = h.render('client-a');
    assert.equal(signedIn.sheet.props.code, firstCode);
    assert.equal(signedIn.sheet.props.userId, 'client-a');
    assert.equal(h.storageCalls.length, 1);
});

test('a warm HTTPS or native link opens the signed-in invite flow with the canonical code', async () => {
    for (const url of [urlFor(firstCode), `dietbridge://davet/${firstCode}`]) {
        const h = harness();
        h.render('client-a');
        await flush();
        h.send(url);
        await flush();
        assert.equal(h.render('client-a').sheet.props.code, firstCode);
        assert.equal(h.stored, firstCode);
    }
});

test('invalid links cannot open a sheet or overwrite a pending invite', async () => {
    const h = harness();
    h.render('client-a');
    await flush();
    for (const url of ['https://evil.invalid/davet/' + firstCode, urlFor('../../invalid'), urlFor(firstCode) + '?token=bad', 'http://app.dietbridge.com.tr/davet/' + firstCode]) h.send(url);
    await flush();
    assert.equal(h.render('client-a').sheet, null);
    assert.equal(h.stored, null);
    assert.equal(h.storageCalls.length, 0);
});

test('a late cold-start URL cannot overwrite a newer warm-link selection', async () => {
    const initial = deferred();
    const h = harness({ initialUrl: initial.promise, savedCode: firstCode });
    h.render('client-a');
    h.send(urlFor(secondCode));
    await flush();
    initial.resolve(urlFor(firstCode));
    await flush();
    assert.equal(h.render('client-a').sheet.props.code, secondCode);
    assert.equal(h.stored, secondCode);
});

test('restored invite remains hidden during logout and rebinds to the new authenticated account', async () => {
    const h = harness({ savedCode: firstCode });
    h.render();
    await flush();
    assert.equal(h.render().sheet, null);
    assert.equal(h.render('client-a').sheet.props.userId, 'client-a');
    assert.equal(h.render().sheet, null);
    assert.equal(h.render('client-b').sheet.props.userId, 'client-b');
    assert.equal(h.render('client-b').sheet.props.code, firstCode);
});

test('closing or completing the flow clears the persisted invite and hides the sheet', async () => {
    for (const action of ['onClose', 'onComplete']) {
        const h = harness({ savedCode: firstCode });
        h.render('client-a');
        await flush();
        await h.render('client-a').sheet.props[action]();
        assert.equal(h.stored, null);
        assert.equal(h.render('client-a').sheet, null);
        assert.deepEqual(h.storageCalls, [['clear']]);
    }
});

test('unmounted flow ignores a delayed initial URL and removes its listener', async () => {
    const initial = deferred();
    const h = harness({ initialUrl: initial.promise });
    h.render('client-a');
    h.unmount();
    initial.resolve(urlFor(firstCode));
    h.send(urlFor(secondCode));
    await flush();
    assert.equal(h.storageCalls.length, 0);
    assert.equal(h.stored, null);
});
