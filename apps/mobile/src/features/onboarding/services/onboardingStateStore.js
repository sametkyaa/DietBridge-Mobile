import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'dietbridge:onboarding:v1:';

const EMPTY_STATE = Object.freeze({
    setupCompleted: false,
    checklistDismissed: false,
    firstWaterLogged: false,
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
            firstWaterLogged: parsed?.firstWaterLogged === true,
        };
    } catch {
        return { ...EMPTY_STATE };
    }
};

const pendingWrites = new Map();

export const updateOnboardingState = async (userId, patch = {}) => {
    if (!userId) return { ...EMPTY_STATE };
    // Serialize patches so setup/dismiss writes cannot erase the first-water milestone.
    const previous = pendingWrites.get(userId) || Promise.resolve();
    const write = previous.catch(() => {}).then(async () => {
        const current = await readOnboardingState(userId);
        const next = {
            ...current,
            ...patch,
            firstWaterLogged: current.firstWaterLogged || patch.firstWaterLogged === true,
        };
        await AsyncStorage.setItem(getKey(userId), JSON.stringify(next));
        return next;
    });
    pendingWrites.set(userId, write);
    try {
        return await write;
    } finally {
        if (pendingWrites.get(userId) === write) pendingWrites.delete(userId);
    }
};

// A profile counts as set up once the three fields the setup flow asks for first are filled.
export const isProfileSetUp = (profile) => Boolean(
    profile
    && profile.goalId !== null && profile.goalId !== undefined
    && profile.heightCm !== null && profile.heightCm !== undefined
    && profile.currentWeight !== null && profile.currentWeight !== undefined,
);
