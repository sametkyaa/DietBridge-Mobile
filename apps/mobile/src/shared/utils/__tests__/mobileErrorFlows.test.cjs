'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const userError = require('../userError.cjs');
const flush = () => new Promise(resolve => setImmediate(resolve));

// Execute the actual hooks with isolated service boundaries. No account or DB writes occur.
function hooks() {
  let index = 0;
  const slots = [];
  const useState = initial => {
    const slot = index++;
    if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
    return [slots[slot], value => { slots[slot] = typeof value === 'function' ? value(slots[slot]) : value; }];
  };
  const memo = (factory, deps) => {
    const slot = index++;
    if (!slots[slot] || deps.some((value, i) => value !== slots[slot].deps[i])) slots[slot] = { deps, value: factory() };
    return slots[slot].value;
  };
  return {
    reset: () => { index = 0; }, useState,
    useRef: initial => memo(() => ({ current: initial }), []),
    useMemo: memo, useCallback: (fn, deps) => memo(() => fn, deps),
    useEffect: (fn, deps) => { memo(() => { fn(); return true; }, deps); },
  };
}
function load(relative, name, inputs) {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../', relative), 'utf8')
    .replace(/^import[\s\S]*?;\r?\n/gm, '').replace(/^export /gm, '');
  return new Function(...Object.keys(inputs), `${source}; return ${name};`)(...Object.values(inputs));
}
function authHarness({ signup = async () => ({}), signin = async () => ({}), enabled = true } = {}) {
  const h = hooks();
  const alerts = [];
  let writes = 0;
  let logins = 0;
  const inputs = {
    ...h, ...userError,
    ...require('../../../features/auth/utils/legalAcceptancePolicy.cjs'),
    ...require('../../../features/auth/utils/emailConfirmationPolicy.cjs'),
    HEALTH_CONSENT_UI_ENABLED: enabled,
    Alert: { alert: (...args) => alerts.push(args) },
    ACCOUNT_DELETION_PHASES: {}, getAccountDeletionState: async () => ({}), getAccountDeletionCleanupState: async () => ({}),
    signIn: async (...args) => { logins += 1; return signin(...args); },
    signUp: async (...args) => { writes += 1; return signup(...args); },
  };
  for (const key of ['ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE', 'ACCOUNT_DELETION_PENDING_ERROR_MESSAGE', 'ACCOUNT_DELETION_RETRY_MESSAGE',
    'ACCOUNT_DELETION_SESSION_MISMATCH_MESSAGE', 'ACCOUNT_DELETION_STATE_ERROR_MESSAGE', 'CLIENT_ONLY_ERROR_MESSAGE',
    'GENERIC_AUTH_ERROR_MESSAGE', 'LOGIN_FAILED_ERROR_MESSAGE', 'PROFILE_NOT_FOUND_ERROR_MESSAGE']) inputs[key] = key;
  const hook = load('features/auth/viewmodels/useAuthViewModel.js', 'useAuthViewModel', inputs);
  const render = () => { h.reset(); return hook(); };
  const fill = ({ password = 'Safe12!', confirmation = password, storage = true, sharing = true } = {}) => {
    const vm = render();
    vm.setMode('signup'); vm.setEmail('fixture@example.test'); vm.setFullName('Fixture Client');
    vm.setPassword(password); vm.setConfirmPassword(confirmation);
    vm.setTermsAccepted(true); vm.setKvkkAcknowledged(true);
    vm.setHealthStorageAccepted(storage); vm.setHealthSharingAccepted(sharing);
    return render();
  };
  return { render, fill, alerts, get writes() { return writes; }, get logins() { return logins; } };
}

test('short and mismatched registration passwords stay on their field without reaching account creation', async () => {
  for (const [input, field, code] of [[{ password: 'abc' }, 'password', 'DB-AUTH-PASSWORD-SHORT'],
    [{ confirmation: 'Different12!' }, 'confirmPassword', 'DB-AUTH-PASSWORD-MISMATCH']]) {
    const h = authHarness();
    await h.fill(input).handleAuth();
    assert.equal(h.writes, 0);
    assert.equal(h.alerts.length, 0);
    assert.equal(h.render().fieldErrors[field], userError.getUserError({ code }).message);
    h.render().setPassword('Correct123!');
    assert.equal(h.render().fieldErrors.password, null);
    assert.equal(h.render().fieldErrors.confirmPassword, null);
  }
});

test('unchecked startup health choices cannot create an account even when submitting directly', async () => {
  for (const input of [{ storage: false, sharing: false }, { storage: true, sharing: false }, { storage: false, sharing: true }]) {
    const h = authHarness();
    await h.fill(input).handleAuth();
    assert.equal(h.writes, 0);
    assert.equal(h.alerts[0][1], userError.getUserError({ code: input.storage ? 'HEALTH_SHARING_REQUIRED' : 'HEALTH_STORAGE_REQUIRED' }).message);
  }
});

test('registration email validation explains the fix without exposing a code or creating an account', async () => {
  for (const [email, expected] of [['', 'E-posta adresini gir.'], ['a@example', 'Geçerli bir e-posta adresi gir. Örnek: ad@ornek.com']]) {
    const h = authHarness();
    h.fill().setEmail(email);
    await h.render().handleAuth();
    assert.equal(h.writes, 0);
    assert.equal(h.alerts.length, 0);
    assert.equal(h.render().fieldErrors.email, expected);
    h.render().setEmail('valid@example.test');
    assert.equal(h.render().fieldErrors.email, null);
  }
});

test('registration backend email failures keep the actionable message on the email field', async () => {
  const h = authHarness({ signup: async () => { throw { code: 'email_exists', message: 'private backend details' }; } });
  await h.fill().handleAuth();
  assert.equal(h.render().fieldErrors.email, 'Bu e-posta adresiyle zaten hesap var. Giriş yapabilir veya şifreni sıfırlayabilirsin.');
  assert.equal(h.alerts.length, 0);
});

test('valid registration sends explicit choices and a double tap cannot submit twice', async () => {
  let finish;
  let payload;
  const h = authHarness({ signup: (...args) => { payload = args; return new Promise(resolve => { finish = resolve; }); } });
  const vm = h.fill();
  const pending = vm.handleAuth();
  await vm.handleAuth();
  assert.equal(h.writes, 1);
  assert.deepEqual(payload[4].healthConsent, { storage: true, sharing: true });
  finish({}); await pending;
  assert.equal(h.render().mode, 'signin');
  assert.equal(h.render().loading, false);
});

test('existing short login passwords remain valid inputs and backend network failures are not wrong-password errors', async () => {
  const h = authHarness({ signin: async (_email, password) => { assert.equal(password, 'old'); throw { message: 'Network request failed' }; } });
  h.render().setEmail('fixture@example.test'); h.render().setPassword('old');
  await h.render().handleAuth();
  assert.equal(h.logins, 1);
  assert.equal(h.alerts[0][1], userError.getUserError({ code: 'NETWORK_UNAVAILABLE' }).message);
});

test('backend password minimum is displayed accurately in the registration field', async () => {
  const h = authHarness({ signup: async () => { throw { code: 'weak_password', message: 'Password should be at least 8 characters.', reasons: ['length'] }; } });
  await h.fill({ password: '123456' }).handleAuth();
  assert.match(h.render().fieldErrors.password, /en az 8 karakter/);
  assert.equal(h.render().mode, 'signup');
});

test('password recovery service keeps weak-password and network explanations distinct and blocks short input before auth requests', async () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../../../features/auth/services/authService.js'), 'utf8');
  const body = source.slice(source.indexOf('export const updatePassword =')).replace('export const', 'const');
  for (const [failure, expected] of [
    [{ code: 'weak_password', reasons: ['characters'] }, 'DB-AUTH-PASSWORD-CHARACTERS'],
    [{ code: 'same_password' }, 'DB-AUTH-PASSWORD-SAME'],
    [new Error('Network request failed'), 'DB-NETWORK-UNAVAILABLE'],
  ]) {
    let requests = 0;
    const inputs = { ...userError, activePasswordRecoveryUserId: 'fixture', PASSWORD_UPDATE_ERROR_MESSAGE: 'Şifreniz güncellenemedi.',
      supabase: { auth: {
        getSession: async () => { requests += 1; return { data: { session: { user: { id: 'fixture' } } } }; },
        updateUser: async () => { if (failure instanceof Error) throw failure; return { error: failure }; },
      } } };
    const update = new Function(...Object.keys(inputs), body + '; return updatePassword;')(...Object.values(inputs));
    assert.equal((await update('abc')).code, 'DB-AUTH-PASSWORD-SHORT');
    assert.equal(requests, 0);
    assert.equal((await update('Safe12!')).code, expected);
    assert.equal(requests, 1);
  }
});

test('onboarding back preserves field values, consumes back during saving and finishing still exits', async () => {
  const h = hooks();
  let finishSave;
  let exits = 0;
  let completed = 0;
  const hook = load('features/onboarding/viewmodels/useOnboardingSetupViewModel.js', 'useOnboardingSetupViewModel', {
    ...h,
    useDietitianConnection: () => ({ hasActiveDietitian: true, isLoadingConnection: false }),
    getClientProfile: async () => ({}), getProfileReferenceData: async () => ({ clientGoals: [{ id: 1 }] }),
    updateCurrentUserProfile: async () => new Promise(resolve => { finishSave = resolve; }),
    saveCurrentWeight: async () => assert.fail('Back cannot create a measurement'),
    updateOnboardingState: async (_id, state) => { assert.equal(state.setupCompleted, true); completed += 1; },
  });
  const props = { userId: 'synthetic-client', onExit: () => { exits += 1; } };
  const render = () => { h.reset(); return hook(props); };
  render(); await flush();
  assert.equal(render().back(), false);
  render().setField('goalId', 1);
  const pending = render().next();
  assert.equal(render().isSaving, true);
  assert.equal(render().back(), true);
  assert.equal(render().stepIndex, 0);
  finishSave(); await pending;
  render().setField('heightCm', '170');
  assert.equal(render().back(), true);
  assert.equal(render().stepIndex, 0);
  assert.equal(render().form.heightCm, '170');
  render().skip(); render().skip(); render().skip();
  await flush();
  assert.equal(completed, 1);
  assert.equal(exits, 1);
});
