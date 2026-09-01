import { supabase } from '../../../lib/supabaseClient';
const {
    MEAL_COMPLETION_PHOTO_BUCKET,
    isCanonicalMealCompletionPhotoPath,
} = require('./mealCompletionPhotoContract.cjs');

export const MEAL_PHOTO_BUCKET = 'meal-photos';
export const RECIPE_PHOTO_BUCKET = 'recipe-images';
export { MEAL_COMPLETION_PHOTO_BUCKET, isCanonicalMealCompletionPhotoPath };
export const MEAL_PHOTO_SIGNED_URL_SECONDS = 5 * 60;
export const MEAL_PHOTO_CACHE_MS = 4 * 60 * 1000;
export const MEAL_PHOTO_CACHE_MAX_ENTRIES = 100;

const RECIPE_PHOTO_PATH_PREFIX = 'recipes/';
const MEAL_PHOTO_PATH_PREFIX = 'meal-plans/';
const EXTERNAL_URL_PATTERN = /^https?:\/\/\S+$/i;

export const MealPhotoResolveStatus = {
    READY: 'ready',
    PLACEHOLDER: 'placeholder',
    ERROR: 'error',
};

export const getMealPhotoSource = (value) => {
    if (typeof value !== 'string') return null;

    const photoPath = value.trim();
    if (!photoPath) return null;
    if (EXTERNAL_URL_PATTERN.test(photoPath)) return { kind: 'external', photoPath };
    if (isCanonicalMealCompletionPhotoPath(photoPath)) {
        return { kind: 'storage', bucket: MEAL_COMPLETION_PHOTO_BUCKET, photoPath };
    }
    if (photoPath.startsWith(RECIPE_PHOTO_PATH_PREFIX)) {
        return { kind: 'storage', bucket: RECIPE_PHOTO_BUCKET, photoPath };
    }
    if (photoPath.startsWith(MEAL_PHOTO_PATH_PREFIX)) {
        return { kind: 'storage', bucket: MEAL_PHOTO_BUCKET, photoPath };
    }
    return null;
};

export const isCanonicalMealPhotoPath = (value) => getMealPhotoSource(value)?.kind === 'storage';

export const createMealPhotoRequestGate = () => {
    let activePath = null;
    let version = 0;

    return {
        begin: (photoPath) => {
            activePath = photoPath;
            version += 1;
            return { photoPath, version };
        },
        isCurrent: (request) => (
            request?.photoPath === activePath && request?.version === version
        ),
        invalidate: () => {
            version += 1;
        },
    };
};

export const createMealPhotoImageRetryGate = () => {
    const retriedPaths = new Set();
    return {
        canRetry: (photoPath) => {
            if (!isCanonicalMealPhotoPath(photoPath) || retriedPaths.has(photoPath)) return false;
            retriedPaths.add(photoPath);
            return true;
        },
    };
};

const placeholderResult = (status = MealPhotoResolveStatus.PLACEHOLDER) => ({
    photoUri: null,
    status,
});

export const createMealPhotoResolver = ({
    storage = supabase.storage,
    getSession = () => supabase.auth.getSession(),
    now = () => Date.now(),
} = {}) => {
    const cache = new Map();
    const inFlight = new Map();

    const pruneCache = (currentTime) => {
        cache.forEach((entry, path) => {
            if (entry.refreshAfter <= currentTime) cache.delete(path);
        });
    };

    const makeCacheRoom = () => {
        while (cache.size >= MEAL_PHOTO_CACHE_MAX_ENTRIES) {
            cache.delete(cache.keys().next().value);
        }
    };

    const resolve = async (photoPath, { forceRefresh = false } = {}) => {
        const source = getMealPhotoSource(photoPath);
        if (!source) return placeholderResult();
        if (source.kind === 'external') {
            return { photoUri: source.photoPath, status: MealPhotoResolveStatus.READY };
        }

        if (forceRefresh) cache.delete(source.photoPath);

        const currentTime = now();
        pruneCache(currentTime);
        const cached = cache.get(source.photoPath);
        if (cached && cached.refreshAfter > currentTime) return cached.result;

        const existingRequest = inFlight.get(source.photoPath);
        if (existingRequest) return existingRequest;

        const request = (async () => {
            try {
                const { data: sessionData, error: sessionError } = await getSession();
                if (sessionError || !sessionData?.session) return placeholderResult(MealPhotoResolveStatus.ERROR);

                const { data, error } = await storage
                    .from(source.bucket)
                    .createSignedUrl(source.photoPath, MEAL_PHOTO_SIGNED_URL_SECONDS);
                if (error || !data?.signedUrl) return placeholderResult(MealPhotoResolveStatus.ERROR);

                const result = {
                    photoUri: data.signedUrl,
                    status: MealPhotoResolveStatus.READY,
                };
                makeCacheRoom();
                cache.set(source.photoPath, {
                    result,
                    refreshAfter: now() + MEAL_PHOTO_CACHE_MS,
                });
                return result;
            } catch {
                return placeholderResult(MealPhotoResolveStatus.ERROR);
            } finally {
                inFlight.delete(source.photoPath);
            }
        })();

        inFlight.set(source.photoPath, request);
        return request;
    };

    return {
        resolve,
        refresh: (photoPath) => resolve(photoPath, { forceRefresh: true }),
        clear: (photoPath) => {
            const source = getMealPhotoSource(photoPath);
            if (source?.kind === 'storage') cache.delete(source.photoPath);
            else cache.clear();
        },
    };
};

const resolver = createMealPhotoResolver();

export const resolveMealPhotoUri = (photoPath) => resolver.resolve(photoPath);
export const refreshMealPhotoUri = (photoPath) => resolver.refresh(photoPath);
