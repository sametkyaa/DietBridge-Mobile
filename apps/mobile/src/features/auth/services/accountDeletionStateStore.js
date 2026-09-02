import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCOUNT_DELETION_STATE_STORAGE_KEY = '@dietbridge/account-deletion-state';
export const ACCOUNT_DELETION_STATE_VERSION = 2;
export const LEGACY_ACCOUNT_DELETION_STATE_VERSION = 1;

export const ACCOUNT_DELETION_PHASES = Object.freeze({
    REMOTE_PENDING: 'remote_pending',
    LOCAL_CLEANUP_PENDING: 'local_cleanup_pending',
});

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_STATE_KEYS = ['version', 'active', 'userId'];
const STATE_KEYS = ['version', 'active', 'userId', 'phase'];

const createFailure = (code) => ({ ok: false, code });

const isValidUserId = (userId) => (
    typeof userId === 'string' && USER_ID_PATTERN.test(userId)
);

const hasExactKeys = (value, expectedKeys) => {
    const keys = Object.keys(value);
    return keys.length === expectedKeys.length
        && keys.every((key) => expectedKeys.includes(key));
};

const isValidBaseState = (value, version, keys) => (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.version === version
    && value.active === true
    && isValidUserId(value.userId)
    && hasExactKeys(value, keys)
);

const isValidPhase = (phase) => Object.values(ACCOUNT_DELETION_PHASES).includes(phase);

const toPublicState = (value, version, phase) => ({
    version,
    active: true,
    userId: value.userId,
    phase,
});

const toStoredState = (userId, phase) => ({
    version: ACCOUNT_DELETION_STATE_VERSION,
    active: true,
    userId,
    phase,
});

export const saveAccountDeletionState = async (
    userId,
    phase = ACCOUNT_DELETION_PHASES.REMOTE_PENDING,
) => {
    if (!isValidUserId(userId)) return createFailure('ACCOUNT_DELETION_USER_INVALID');
    if (!isValidPhase(phase)) return createFailure('ACCOUNT_DELETION_PHASE_INVALID');

    try {
        await AsyncStorage.setItem(
            ACCOUNT_DELETION_STATE_STORAGE_KEY,
            JSON.stringify(toStoredState(userId, phase)),
        );
        return { ok: true, state: { ...toStoredState(userId, phase) } };
    } catch (_error) {
        return createFailure('ACCOUNT_DELETION_STATE_SAVE_FAILED');
    }
};

export const setAccountDeletionPhase = async (userId, phase) => {
    if (!isValidUserId(userId)) return createFailure('ACCOUNT_DELETION_USER_INVALID');
    if (!isValidPhase(phase)) return createFailure('ACCOUNT_DELETION_PHASE_INVALID');

    const currentState = await getAccountDeletionState();
    if (!currentState?.ok) return createFailure(currentState?.code || 'ACCOUNT_DELETION_STATE_READ_FAILED');
    if (!currentState.state || currentState.state.userId !== userId) {
        return createFailure('ACCOUNT_DELETION_MARKER_MISMATCH');
    }

    try {
        await AsyncStorage.setItem(
            ACCOUNT_DELETION_STATE_STORAGE_KEY,
            JSON.stringify(toStoredState(userId, phase)),
        );
        return { ok: true, state: { ...toStoredState(userId, phase) } };
    } catch (_error) {
        return createFailure('ACCOUNT_DELETION_PHASE_SAVE_FAILED');
    }
};

export const clearAccountDeletionState = async () => {
    try {
        await AsyncStorage.removeItem(ACCOUNT_DELETION_STATE_STORAGE_KEY);
        return { ok: true };
    } catch (_error) {
        return createFailure('ACCOUNT_DELETION_STATE_CLEAR_FAILED');
    }
};

export const getAccountDeletionState = async () => {
    let storedValue;

    try {
        storedValue = await AsyncStorage.getItem(ACCOUNT_DELETION_STATE_STORAGE_KEY);
    } catch (_error) {
        return createFailure('ACCOUNT_DELETION_STATE_READ_FAILED');
    }

    if (storedValue === null) return { ok: true, state: null };

    let parsedValue;
    try {
        parsedValue = JSON.parse(storedValue);
    } catch (_error) {
        return createFailure('ACCOUNT_DELETION_STATE_MALFORMED');
    }

    if (isValidBaseState(parsedValue, ACCOUNT_DELETION_STATE_VERSION, STATE_KEYS)
        && isValidPhase(parsedValue.phase)) {
        return { ok: true, state: toPublicState(parsedValue, ACCOUNT_DELETION_STATE_VERSION, parsedValue.phase) };
    }

    if (isValidBaseState(parsedValue, LEGACY_ACCOUNT_DELETION_STATE_VERSION, LEGACY_STATE_KEYS)) {
        return {
            ok: true,
            state: toPublicState(
                parsedValue,
                LEGACY_ACCOUNT_DELETION_STATE_VERSION,
                ACCOUNT_DELETION_PHASES.REMOTE_PENDING,
            ),
        };
    }

    return createFailure('ACCOUNT_DELETION_STATE_MALFORMED');
};
