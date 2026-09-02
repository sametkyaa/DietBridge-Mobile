'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const store = read('apps/mobile/src/features/auth/services/accountDeletionStateStore.js');
const service = read('apps/mobile/src/features/auth/services/accountDeletionService.js');
const auth = read('apps/mobile/src/features/auth/services/authService.js');
const authViewModel = read('apps/mobile/src/features/auth/viewmodels/useAuthViewModel.js');
const loginView = read('apps/mobile/src/features/auth/components/LoginView.js');
const supabaseClient = read('apps/mobile/src/lib/supabaseClient.js');
const packageLock = read('package-lock.json');

test('Account deletion 1: the pending marker has a dedicated key and versioned minimal schema', () => {
    assert.match(store, /ACCOUNT_DELETION_STATE_STORAGE_KEY\s*=\s*['"]@dietbridge\/account-deletion-state['"]/);
    assert.match(store, /ACCOUNT_DELETION_STATE_VERSION\s*=\s*2/);
    assert.match(store, /const STATE_KEYS\s*=\s*\['version',\s*'active',\s*'userId',\s*'phase'\]/);
    assert.match(store, /const LEGACY_STATE_KEYS\s*=\s*\['version',\s*'active',\s*'userId'\]/);
    assert.match(store, /const toStoredState\s*=\s*\(userId,\s*phase\)\s*=>\s*\(\{[\s\S]*version:\s*ACCOUNT_DELETION_STATE_VERSION,[\s\S]*active:\s*true,[\s\S]*userId,[\s\S]*phase,/);
    assert.match(store, /Object\.keys\(value\)/);
    assert.match(store, /keys\.every/);
});

test('Account deletion 2: marker validation is strict and UUID-bound', () => {
    assert.match(store, /const USER_ID_PATTERN = \/\^\[0-9a-f\]/i);
    assert.match(store, /value\.version === version/);
    assert.match(store, /isValidBaseState\(parsedValue, ACCOUNT_DELETION_STATE_VERSION, STATE_KEYS\)/);
    assert.match(store, /isValidBaseState\(parsedValue, LEGACY_ACCOUNT_DELETION_STATE_VERSION, LEGACY_STATE_KEYS\)/);
    assert.match(store, /value\.active === true/);
    assert.match(store, /isValidUserId\(value\.userId\)/);
    assert.match(store, /isValidPhase\(parsedValue\.phase\)/);
    assert.match(store, /ACCOUNT_DELETION_STATE_MALFORMED/);
});

test('Account deletion 3: marker storage never persists credentials or token material', () => {
    assert.doesNotMatch(store, /access[_-]?token|refresh[_-]?token|password|jwt|service[_-]?role|reset-password/i);
});

test('Account deletion 4: request verifies the current session and expected user identity', () => {
    assert.match(service, /supabase\.auth\.getSession\(\)/);
    assert.match(service, /if \(expectedUserId !== undefined && expectedUserId !== userId\)/);
    assert.match(service, /ACCOUNT_DELETION_SESSION_MISMATCH/);
    assert.match(service, /remoteInvoked:\s*false/);
});

test('Account deletion 5: the pending marker is saved before the exact Edge Function request', () => {
    const markerSaveIndex = service.indexOf('const markerResult = await saveAccountDeletionState(');
    const invokeIndex = service.indexOf("supabase.functions.invoke('delete-client-account', { body: {} })");
    assert.ok(markerSaveIndex >= 0);
    assert.ok(invokeIndex > markerSaveIndex);
    assert.match(service.slice(markerSaveIndex, invokeIndex), /ACCOUNT_DELETION_PHASES\.REMOTE_PENDING/);
    assert.match(service, /supabase\.functions\.invoke\('delete-client-account',\s*\{\s*body:\s*\{\}\s*\}\)/);
});

test('Account deletion 6: service exposes explicit safe outcomes and never returns raw backend errors', () => {
    for (const outcome of ['DELETED', 'UNAUTHORIZED', 'FORBIDDEN', 'RETRYABLE', 'AMBIGUOUS_FAILURE', 'LOCAL_CLEANUP_PENDING']) {
        assert.match(service, new RegExp(`\\b${outcome}: ['"]${outcome}['"]`));
    }
    assert.match(service, /ACCOUNT_DELETION_MESSAGES/);
    assert.doesNotMatch(service, /error\.message|error\.details|error\.hint/);
});

test('Account deletion 7: confirmed success requires the canonical deleted payload', () => {
    assert.match(service, /!error && data\?\.data\?\.deleted === true/);
    assert.match(service, /outcome:\s*ACCOUNT_DELETION_OUTCOMES\.DELETED/);
    const successIndex = service.indexOf('if (!error && data?.data?.deleted === true)');
    const phaseIndex = service.indexOf('const phaseResult = await setAccountDeletionPhase(', successIndex);
    assert.ok(successIndex >= 0);
    assert.ok(phaseIndex > successIndex);
    assert.match(service.slice(phaseIndex, service.indexOf('return {', phaseIndex)), /ACCOUNT_DELETION_PHASES\.LOCAL_CLEANUP_PENDING/);
});

test('Account deletion 8: unauthorized and forbidden responses are non-success outcomes', () => {
    assert.match(service, /if \(status === 401\)[\s\S]*?ACCOUNT_DELETION_OUTCOMES\.UNAUTHORIZED/);
    assert.match(service, /if \(status === 403\)[\s\S]*?ACCOUNT_DELETION_OUTCOMES\.FORBIDDEN/);
    assert.match(service, /hadPendingMarker\s*\?\s*false/);
    assert.match(service, /clearMarkerAfterNonDestructiveResponse/);
});

test('Account deletion 9: 503, transport, and malformed responses preserve retry state', () => {
    assert.match(service, /ACCOUNT_DELETION_OUTCOMES\.RETRYABLE/);
    assert.match(service, /status === 503/);
    assert.match(service, /ACCOUNT_DELETION_TRANSPORT_FAILED[\s\S]*markerPreserved:\s*true/);
    assert.match(service, /ACCOUNT_DELETION_RESPONSE_INVALID[\s\S]*markerPreserved:\s*true/);
});

test('Account deletion 10: auth guard checks the marker before profile validation', () => {
    const ensureStart = auth.indexOf('export const ensureClientSession');
    const assertIndex = auth.indexOf('await assertNoPendingAccountDeletion(session);', ensureStart);
    const profileIndex = auth.indexOf('const profile = await getUserProfile(session.user.id);', ensureStart);
    assert.ok(ensureStart >= 0);
    assert.ok(assertIndex > ensureStart);
    assert.ok(profileIndex > assertIndex);
    assert.match(auth, /ACCOUNT_DELETION_PENDING_ERROR_MESSAGE/);
    assert.match(auth, /ACCOUNT_DELETION_STATE_ERROR_MESSAGE/);
    assert.match(auth, /ACCOUNT_DELETION_PHASES\.LOCAL_CLEANUP_PENDING/);
});

test('Account deletion 11: a marker mismatch fails closed and preserves the marker', () => {
    const guardStart = auth.indexOf('const assertNoPendingAccountDeletion');
    const guard = auth.slice(guardStart, auth.indexOf('export const getCurrentAuthenticatedUser', guardStart));
    assert.match(guard, /storedState\.state\.userId !== session\.user\.id/);
    assert.match(guard, /await safeSignOut\(\)/);
    assert.doesNotMatch(guard, /clearAccountDeletionState/);
});

test('Account deletion 12: sign-in retries a matching marker before ensureClientSession or Profile access', () => {
    const signInStart = auth.indexOf('export const signIn = async');
    const signIn = auth.slice(signInStart, auth.indexOf('export const signUp', signInStart));
    const pendingIndex = signIn.indexOf('const pendingDeletionState');
    const retryIndex = signIn.indexOf('requestAccountDeletion({ expectedUserId: data.user.id })');
    const ensureIndex = signIn.indexOf('ensureClientSession(data.session)');
    assert.ok(pendingIndex >= 0);
    assert.ok(retryIndex > pendingIndex);
    assert.ok(ensureIndex > retryIndex);
    assert.doesNotMatch(signIn.slice(pendingIndex, ensureIndex), /getUserProfile/);
});

test('Account deletion 13: a different authenticated user is signed out without invoking deletion', () => {
    const signInStart = auth.indexOf('export const signIn = async');
    const signIn = auth.slice(signInStart, auth.indexOf('export const signUp', signInStart));
    const mismatchStart = signIn.indexOf('pendingDeletionState.state.userId !== data.user.id');
    const mismatch = signIn.slice(mismatchStart, signIn.indexOf('const deletionResult', mismatchStart));
    assert.match(mismatch, /await safeSignOut\(\)/);
    assert.doesNotMatch(mismatch, /requestAccountDeletion/);
});

test('Account deletion 14: confirmed deletion performs local cleanup and clears the marker only afterward', () => {
    const cleanupStart = auth.indexOf('export const completeLocalAccountDeletionCleanup');
    const cleanup = auth.slice(cleanupStart, auth.indexOf('const getPasswordChangeFailure', cleanupStart));
    const signOutIndex = cleanup.indexOf('const signOutResult = await safeSignOut();');
    const markerClearIndex = cleanup.indexOf('const markerResult = await clearAccountDeletionState();');
    assert.ok(signOutIndex >= 0);
    assert.ok(markerClearIndex > signOutIndex);
    assert.match(cleanup, /if \(!signOutResult\?\.ok\)/);
    assert.match(cleanup, /accountDeletionMarkerCleared:\s*false/);
    assert.match(cleanup, /ACCOUNT_DELETION_PHASES\.LOCAL_CLEANUP_PENDING/);
    assert.doesNotMatch(cleanup, /pendingLocalAccountDeletionCleanup/);
});

test('Account deletion 15: local cleanup retry has no remote deletion call', () => {
    const retryStart = auth.indexOf('export const retryLocalAccountDeletionCleanup');
    const retry = auth.slice(retryStart, auth.indexOf('const getPasswordChangeFailure', retryStart));
    assert.match(retry, /completeLocalAccountDeletionCleanup/);
    assert.doesNotMatch(retry, /requestAccountDeletion|functions\.invoke|signInWithPassword/);
});

test('Account deletion 16: local cleanup recovery is durable and removes the competing in-memory authority', () => {
    const signInStart = auth.indexOf('export const signIn = async');
    const signIn = auth.slice(signInStart, auth.indexOf('export const signUp', signInStart));
    const localPhaseIndex = signIn.indexOf('preflightDeletionState.state?.phase === ACCOUNT_DELETION_PHASES.LOCAL_CLEANUP_PENDING');
    const passwordIndex = signIn.indexOf('supabase.auth.signInWithPassword');
    assert.ok(localPhaseIndex >= 0);
    assert.ok(passwordIndex > localPhaseIndex);
    assert.match(auth, /getAccountDeletionCleanupState = async/);
    assert.doesNotMatch(auth, /pendingLocalAccountDeletionCleanup|markAccountDeletionServerDeleted/);
});

test('Account deletion 17: local-cleanup phase is handled before authentication and before any remote retry', () => {
    const signInStart = auth.indexOf('export const signIn = async');
    const signIn = auth.slice(signInStart, auth.indexOf('export const signUp', signInStart));
    const localPhaseIndex = signIn.indexOf('preflightDeletionState.state?.phase === ACCOUNT_DELETION_PHASES.LOCAL_CLEANUP_PENDING');
    const passwordIndex = signIn.indexOf('supabase.auth.signInWithPassword');
    const localErrorIndex = signIn.indexOf('ACCOUNT_DELETION_CLEANUP_ERROR_MESSAGE', localPhaseIndex);
    assert.ok(localPhaseIndex >= 0);
    assert.ok(localErrorIndex > localPhaseIndex);
    assert.ok(passwordIndex > localPhaseIndex);
    assert.doesNotMatch(signIn.slice(localPhaseIndex, passwordIndex), /requestAccountDeletion|ensureClientSession|signInWithPassword/);
});

test('Account deletion 18: confirmed server deletion persists local phase before local cleanup, including phase-save failure handling', () => {
    const serviceSuccessIndex = service.indexOf('if (!error && data?.data?.deleted === true)');
    const servicePhaseIndex = service.indexOf('const phaseResult = await setAccountDeletionPhase(', serviceSuccessIndex);
    const signInStart = auth.indexOf('export const signIn = async');
    const signIn = auth.slice(signInStart, auth.indexOf('export const signUp', signInStart));
    const deletionIndex = signIn.indexOf('const deletionResult = await requestAccountDeletion');
    const cleanupIndex = signIn.indexOf('completeLocalAccountDeletionCleanup({', deletionIndex);
    assert.ok(servicePhaseIndex > serviceSuccessIndex);
    assert.ok(cleanupIndex > deletionIndex);
    assert.match(signIn.slice(cleanupIndex, signIn.indexOf('return createAccountDeletionSignInResult', cleanupIndex)), /serverDeletionConfirmed: deletionResult\.phasePersisted !== true/);
    assert.match(auth, /phasePersisted/);
    assert.match(auth, /ACCOUNT_DELETION_LOCAL_SIGNOUT_FAILED/);
    assert.match(auth, /ACCOUNT_DELETION_MARKER_CLEAR_FAILED/);
});

test('Account deletion 19: a valid v1 marker is retained as remote_pending compatibility state', () => {
    assert.match(store, /LEGACY_ACCOUNT_DELETION_STATE_VERSION\s*=\s*1/);
    assert.match(store, /isValidBaseState\(parsedValue, LEGACY_ACCOUNT_DELETION_STATE_VERSION, LEGACY_STATE_KEYS\)/);
    const legacyStart = store.indexOf('if (isValidBaseState(parsedValue, LEGACY_ACCOUNT_DELETION_STATE_VERSION, LEGACY_STATE_KEYS))');
    const legacy = store.slice(legacyStart);
    assert.match(legacy, /ok:\s*true/);
    assert.match(legacy, /ACCOUNT_DELETION_PHASES\.REMOTE_PENDING/);
    assert.doesNotMatch(legacy, /clearAccountDeletionState/);
});

test('Account deletion 20: Auth startup exposes durable local cleanup without requiring another sign-in', () => {
    assert.match(authViewModel, /getAccountDeletionCleanupState\(\)/);
    assert.match(authViewModel, /storedState\.state\.phase === ACCOUNT_DELETION_PHASES\.LOCAL_CLEANUP_PENDING/);
    assert.match(authViewModel, /handleRetryAccountDeletionCleanup/);
    assert.match(loginView, /Oturumu temizlemeyi tekrar dene/);
    assert.match(loginView, /onRetryAccountDeletionCleanup/);
    assert.match(auth, /retryLocalAccountDeletionCleanup = async \(\) => completeLocalAccountDeletionCleanup\(\)/);
});

test('Account deletion 21: recovery and account-deletion markers remain separate', () => {
    assert.match(auth, /clearPasswordRecoveryState/);
    assert.match(auth, /clearAccountDeletionState/);
    assert.match(store, /@dietbridge\/account-deletion-state/);
    assert.doesNotMatch(store, /@dietbridge\/password-recovery-state/);
});

test('Account deletion 22: password change uses the installed Supabase Auth API without a dependency upgrade', () => {
    assert.match(packageLock, /@supabase\/supabase-js[\s\S]*2\.84\.0/);
    assert.match(auth, /supabase\.auth\.updateUser\(\{ password: newPassword \}\)/);
    assert.match(auth, /supabase\.auth\.signInWithPassword\(\{[\s\S]*email: session\.user\.email,[\s\S]*password: currentPassword,/);
    assert.doesNotMatch(auth, /updateUser\(\{[\s\S]*currentPassword/);
});

test('Account deletion 23: password reauthentication and update both verify the same user id', () => {
    const start = auth.indexOf('export const changeAuthenticatedPassword');
    const change = auth.slice(start, auth.indexOf('export const getUserProfile', start));
    assert.match(change, /currentUser\.user\.id !== session\.user\.id/);
    assert.match(change, /reauthData\.user\.id !== session\.user\.id/);
    assert.match(change, /data\?\.user\?\.id !== session\.user\.id/);
    assert.match(change, /await safeSignOut\(\)/);
});

test('Account deletion 24: password errors stay safe and backend strength remains authoritative', () => {
    assert.match(auth, /weak_password/);
    assert.match(auth, /same_password/);
    assert.match(auth, /PASSWORD_WEAK_MESSAGE/);
    assert.match(auth, /PASSWORD_SAME_MESSAGE/);
    assert.doesNotMatch(auth, /error\.message/);
});

test('Account deletion 25: Supabase client keeps persisted session support needed for restart recovery', () => {
    assert.match(supabaseClient, /persistSession:\s*true/);
    assert.match(supabaseClient, /autoRefreshToken:\s*true/);
    assert.match(supabaseClient, /AsyncStorage/);
});
