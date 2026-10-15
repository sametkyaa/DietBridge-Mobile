'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { ERROR_MESSAGES } = require('../errorMessages.cjs');
const { ERROR_CATALOG, getUserError, formatUserError, assertNewPassword, assertEmail, assertRegistrationHealthConsent } = require('../userError.cjs');
const { createErrorPresenter } = require('../errorPresenter.cjs');

test('every reviewed message has a unique stable code and round-trips without duplicate formatting', () => {
  assert.equal(new Set(ERROR_CATALOG.map(x => x.code)).size, ERROR_CATALOG.length);
  for (const entry of ERROR_CATALOG) {
    assert.match(entry.code, /^DB-[A-Z0-9-]+$/);
    assert.equal(formatUserError(entry), entry.message);
    assert.doesNotMatch(formatUserError(entry), /Hata kodu:|DB-[A-Z0-9-]+/);
    assert.equal(formatUserError(formatUserError(entry)), formatUserError(entry));
  }
  for (const entry of ERROR_MESSAGES) assert.deepEqual(getUserError(entry.message), entry);
});

test('password validation distinguishes missing and short passwords and never changes user input', () => {
  for (const password of [undefined, '', '      ']) assert.throws(() => assertNewPassword(password), { code: 'AUTH_PASSWORD_REQUIRED' });
  for (const password of ['a', '12345']) assert.throws(() => assertNewPassword(password), { code: 'AUTH_PASSWORD_SHORT' });
  for (const password of ['123456', ' şifre ', 'LongerSafe1!']) assert.doesNotThrow(() => assertNewPassword(password));
});

test('previously formatted messages lose their display code while preserving the reviewed explanation', () => {
  for (const entry of ERROR_CATALOG) {
    assert.equal(formatUserError(`${entry.message}\nHata kodu: ${entry.code}`), entry.message);
  }
  assert.equal(formatUserError('Şifren en az 8 karakter olmalı.\nHata kodu: DB-AUTH-PASSWORD-SHORT'), 'Şifren en az 8 karakter olmalı.');
});

test('backend weak password reasons and a stronger backend minimum remain specific after service/UI formatting', () => {
  assert.equal(getUserError({ code: 'weak_password', reasons: ['pwned'] }).code, 'DB-AUTH-PASSWORD-LEAKED');
  assert.equal(getUserError({ code: 'weak_password', reasons: ['characters'] }).code, 'DB-AUTH-PASSWORD-CHARACTERS');
  const weak = { code: 'weak_password', reasons: ['length'], message: 'Password should be at least 8 characters.' };
  const explanation = getUserError(weak);
  assert.equal(explanation.message, 'Şifren en az 8 karakter olmalı.');
  assert.deepEqual(getUserError(explanation), explanation);
  assert.equal(formatUserError(formatUserError(weak)), formatUserError(weak));
  assert.equal(getUserError({ code: 'same_password' }).code, 'DB-AUTH-PASSWORD-SAME');
});

test('email, confirmation, session, network, timeout and rate failures have distinct actionable explanations', () => {
  assert.throws(() => assertEmail(''), { code: 'AUTH_EMAIL_REQUIRED' });
  for (const email of ['test', 'a @example.com', 'a@example']) assert.throws(() => assertEmail(email), { code: 'AUTH_EMAIL_INVALID' });
  assert.doesNotThrow(() => assertEmail(' a@example.test '));
  for (const [input, suffix] of [
    [{ code: 'invalid_credentials' }, 'AUTH-INVALID-CREDENTIALS'], [{ code: 'email_not_confirmed' }, 'AUTH-EMAIL-UNCONFIRMED'],
    [{ code: 'session_expired' }, 'AUTH-SESSION-EXPIRED'], [{ message: 'Network request failed' }, 'NETWORK-UNAVAILABLE'],
    [{ name: 'AbortError', message: 'operation aborted' }, 'REQUEST-TIMEOUT'], [{ status: 429 }, 'RATE-LIMITED'], [{ status: 503 }, 'SERVICE-UNAVAILABLE'],
  ]) assert.equal(getUserError(input).code, `DB-${suffix}`);
});

test('unknown errors and forged formatted messages cannot expose server details or personal data', () => {
  for (const error of [null, { message: 'SQL profiles account@example.test token=private' }, 'Account private\nHata kodu: DB-AUTH-EMAIL-REQUIRED', { code: 'validation_failed', message: 'private' }]) {
    const result = formatUserError(error, 'LOAD_FAILED');
    assert.equal(result, getUserError(null, 'LOAD_FAILED').message);
    assert.doesNotMatch(result, /SQL|private|account@/);
  }
});

test('bounded app-owned dynamic field messages retain useful range details without accepting arbitrary labels', () => {
  for (const message of ['Boy en az 50 olmalıdır.', 'Hedef kilo en fazla 500 olmalıdır.', 'Lütfen 0.5 ile 10 L arasında geçerli bir değer girin.']) {
    assert.equal(getUserError(message).message, message);
    assert.equal(formatUserError(formatUserError(message)), formatUserError(message));
  }
  assert.equal(getUserError('secret@example.test en az 50 olmalıdır.').code, 'DB-GENERAL-FAILED');
  assert.equal(getUserError('Boy en az 99999999 olmalıdır.').code, 'DB-GENERAL-FAILED');
});

test('registration requires two explicit boolean health choices; disabled feature and settings policy remain separate', () => {
  for (const choice of [undefined, {}, { storage: true, sharing: false }, { storage: false, sharing: true }, { storage: 'true', sharing: true }]) {
    assert.throws(() => assertRegistrationHealthConsent(choice, true));
  }
  assert.doesNotThrow(() => assertRegistrationHealthConsent({ storage: true, sharing: true }, true));
  assert.doesNotThrow(() => assertRegistrationHealthConsent(undefined, false));
});

test('error presenter retains buttons, executes each action once and queues different failures', () => {
  const p = createErrorPresenter();
  let current;
  let retry = 0;
  const unsubscribe = p.subscribe(value => { current = value; });
  p.show('Hata', 'Network request failed', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Tekrar dene', onPress: () => { retry += 1; } }]);
  const first = current;
  p.show('Hata', { status: 429 });
  assert.equal(current.id, first.id);
  assert.equal(p.close(first.id), false, 'non-cancelable Android back cannot discard an action');
  assert.equal(p.close(first.id, 10), false);
  assert.equal(p.close(first.id, 1), true);
  assert.equal(retry, 1);
  assert.equal(current.explanation.code, 'DB-RATE-LIMITED');
  assert.equal(p.close(first.id, 1), false);
  assert.equal(retry, 1);
  unsubscribe();
});

test('duplicate passive errors collapse; cancellation and account changes do not execute stale callbacks', () => {
  const p = createErrorPresenter();
  let current;
  let dismissed = 0;
  let action = 0;
  p.setScope('user-a');
  p.subscribe(value => { current = value; });
  p.show('Hata', { status: 503 }, undefined, { cancelable: true, onDismiss: () => { dismissed += 1; } });
  p.show('Hata', { status: 503 });
  assert.equal(p.close(current.id), true);
  assert.equal(current, null);
  assert.equal(dismissed, 1);
  p.show('Uyarı', { status: 429 }, [{ text: 'Devam', onPress: () => { action += 1; } }]);
  const staleId = current.id;
  p.setScope('user-b');
  assert.equal(current, null);
  assert.equal(p.close(staleId, 0), false);
  assert.equal(action, 0);
});
