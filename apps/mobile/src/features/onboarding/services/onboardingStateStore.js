import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'dietbridge:onboarding:v1:';

const EMPTY_STATE = Object.freeze({
    setupCompleted: false,
    checklistDismissed: false,
});

const getKey = (userId) => `${STORAGE_PREFIX}${userId}`;

export const readOnboardingState = async (userId) => {
    if (!userId) return { ...EMPTY_STATE };
    const raw = await AsyncStorage.getItem(getKey(userId));
    if (!raw) return { ...EMPTY_STATE };
    try {
        const parsed = JSON.parse(raw);
        return {
            setupCompleted: parsed?.setupCompleted === true,
            checklistDismissed: parsed?.checklistDismissed === true,
        };
    } catch {
        return { ...EMPTY_STATE };
    }
};

export const updateOnboardingState = async (userId, patch = {}) => {
    if (!userId) return { ...EMPTY_STATE };
    const current = await readOnboardingState(userId);
    const next = { ...current, ...patch };
    await AsyncStorage.setItem(getKey(userId), JSON.stringify(next));
    return next;
};

// A profile counts as set up once the three fields the setup flow asks for first are filled.
export const isProfileSetUp = (profile) => Boolean(
    profile
    && profile.goalId !== null && profile.goalId !== undefined
    && profile.heightCm !== null && profile.heightCm !== undefined
    && profile.currentWeight !== null && profile.currentWeight !== undefined,
);
