import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCOUNT_DELETION_STATE_STORAGE_KEY = '@dietbridge/account-deletion-state';
export const ACCOUNT_DELETION_STATE_VERSION = 1;

const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createFailure = (code) => ({ ok: false, code });

const isValidUserId = (userId) => (
    typeof userId === 'string' && USER_ID_PATTERN.test(userId)
);

const isValidStoredState = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (value.version !== ACCOUNT_DELETION_STATE_VERSION || value.active !== true) return false;
    if (!isValidUserId(value.userId)) return false;

    return Object.keys(value).every((key) => ['version', 'active', 'userId'].includes(key));
};

const toPublicState = (value) => ({
    active: true,
    userId: value.userId,
});

export const saveAccountDeletionState = async (userId) => {
    if (!isValidUserId(userId)) return createFailure('ACCOUNT_DELETION_USER_INVALID');

    try {
        await AsyncStorage.setItem(
            ACCOUNT_DELETION_STATE_STORAGE_KEY,
            JSON.stringify({
                version: ACCOUNT_DELETION_STATE_VERSION,
                active: true,
                userId,
            }),
        );
        return { ok: true, state: { active: true, userId } };
    } catch (_error) {
        return createFailure('ACCOUNT_DELETION_STATE_SAVE_FAILED');
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

    if (!isValidStoredState(parsedValue)) {
        return createFailure('ACCOUNT_DELETION_STATE_MALFORMED');
    }

    return { ok: true, state: toPublicState(parsedValue) };
};
