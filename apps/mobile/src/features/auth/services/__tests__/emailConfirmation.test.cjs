const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const policy = require('../../utils/emailConfirmationPolicy.cjs');
const source = fs.readFileSync(path.resolve(__dirname, '../authService.js'), 'utf8');

test('email-not-confirmed is recognized by machine code or legacy message without guessing from HTTP status', () => {
  assert(policy.isEmailNotConfirmedError({ code: 'email_not_confirmed', message: 'Localized message' }));
  assert(policy.isEmailNotConfirmedError({ message: 'Email not confirmed' }));
  for (const value of [null, { status: 400 }, { code: 'invalid_credentials' }, { message: 'Internal error' }]) {
    assert.equal(policy.isEmailNotConfirmedError(value), false);
  }
});

test('real sign-in service reports confirmation error before profile access and cleans the session', async () => {
  const start = source.indexOf('export const signIn =');
  const end = source.indexOf('export const signUp =', start);
  for (const error of [{ code: 'email_not_confirmed' }, { message: 'Email not confirmed' }, { code: 'invalid_credentials' }]) {
    let signOuts = 0;
    const context = {
      ...policy, ACCOUNT_DELETION_PHASES: { LOCAL_CLEANUP_PENDING: 'local_cleanup_pending' },
      readPendingAccountDeletionState: async () => ({ ok: true, state: null }),
      safeSignOut: async () => { signOuts += 1; }, LOGIN_FAILED_ERROR_MESSAGE: 'E-posta veya şifre hatalı.',
      supabase: { auth: { signInWithPassword: async () => ({ data: null, error }) } },
      ensureClientSession: () => assert.fail('Unconfirmed user must not access profiles'),
    };
    vm.createContext(context);
    vm.runInContext(source.slice(start, end).replace('export const signIn =', 'globalThis.signIn ='), context);
    await assert.rejects(context.signIn('fixture@example.test', 'fixture-password'),
      (failure) => failure.message === (policy.isEmailNotConfirmedError(error)
        ? policy.EMAIL_NOT_CONFIRMED_MESSAGE : context.LOGIN_FAILED_ERROR_MESSAGE));
    assert.equal(signOuts, 1);
  }
});

test('the ViewModel preserves the safe confirmation message in its displayed-error allowlist', () => {
  const viewModel = fs.readFileSync(path.resolve(__dirname, '../../viewmodels/useAuthViewModel.js'), 'utf8');
  assert.match(viewModel, /const KNOWN_AUTH_MESSAGES = \[\s*EMAIL_NOT_CONFIRMED_MESSAGE,/);
});
