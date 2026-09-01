import AsyncStorage from '@react-native-async-storage/async-storage';

const PASSWORD_RECOVERY_STATE_STORAGE_KEY = '@dietbridge/password-recovery-state';
const PASSWORD_RECOVERY_STATE_VERSION = 1;
const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createFailure = (code) => ({ ok: false, code });

const isValidUserId = (userId) => (
    typeof userId === 'string' && USER_ID_PATTERN.test(userId)
);

const isValidStoredState = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    if (value.version !== PASSWORD_RECOVERY_STATE_VERSION || value.active !== true) return false;
    if (!isValidUserId(value.userId)) return false;

    return Object.keys(value).every((key) => ['version', 'active', 'userId'].includes(key));
};

export const savePasswordRecoveryState = async (userId) => {
    if (!isValidUserId(userId)) return createFailure('PASSWORD_RECOVERY_USER_INVALID');

    try {
        await AsyncStorage.setItem(
            PASSWORD_RECOVERY_STATE_STORAGE_KEY,
            JSON.stringify({
                version: PASSWORD_RECOVERY_STATE_VERSION,
                active: true,
                userId,
            }),
        );
        return { ok: true };
    } catch (_error) {
        return createFailure('PASSWORD_RECOVERY_STATE_SAVE_FAILED');
    }
};

export const clearPasswordRecoveryState = async () => {
    try {
        await AsyncStorage.removeItem(PASSWORD_RECOVERY_STATE_STORAGE_KEY);
        return { ok: true };
    } catch (_error) {
        return createFailure('PASSWORD_RECOVERY_STATE_CLEAR_FAILED');
    }
};

export const getPasswordRecoveryState = async ({ isCurrent = () => true } = {}) => {
    let storedValue;

    try {
        storedValue = await AsyncStorage.getItem(PASSWORD_RECOVERY_STATE_STORAGE_KEY);
    } catch (_error) {
        return createFailure('PASSWORD_RECOVERY_STATE_READ_FAILED');
    }

    if (storedValue === null) return { ok: true, state: null };

    let parsedValue;
    try {
        parsedValue = JSON.parse(storedValue);
    } catch (_error) {
        if (!isCurrent()) return createFailure('PASSWORD_RECOVERY_STATE_STALE');
        const clearResult = await clearPasswordRecoveryState();
        if (!isCurrent()) return createFailure('PASSWORD_RECOVERY_STATE_STALE');
        return createFailure(
            clearResult.ok
                ? 'PASSWORD_RECOVERY_STATE_MALFORMED'
                : 'PASSWORD_RECOVERY_STATE_MALFORMED_UNCLEARED',
        );
    }

    if (!isValidStoredState(parsedValue)) {
        if (!isCurrent()) return createFailure('PASSWORD_RECOVERY_STATE_STALE');
        const clearResult = await clearPasswordRecoveryState();
        if (!isCurrent()) return createFailure('PASSWORD_RECOVERY_STATE_STALE');
        return createFailure(
            clearResult.ok
                ? 'PASSWORD_RECOVERY_STATE_MALFORMED'
                : 'PASSWORD_RECOVERY_STATE_MALFORMED_UNCLEARED',
        );
    }

    return {
        ok: true,
        state: {
            active: true,
            userId: parsedValue.userId,
        },
    };
};
