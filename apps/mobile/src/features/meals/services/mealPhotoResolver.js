import { supabase } from '../../../lib/supabaseClient';

export const MEAL_PHOTO_BUCKET = 'meal-photos';
export const MEAL_PHOTO_SIGNED_URL_SECONDS = 5 * 60;
export const MEAL_PHOTO_CACHE_MS = 4 * 60 * 1000;

const CANONICAL_MEAL_PHOTO_PATH = /^meal-plans\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;

export const MealPhotoResolveStatus = {
    READY: 'ready',
    PLACEHOLDER: 'placeholder',
    ERROR: 'error',
};

export const isCanonicalMealPhotoPath = (value) => (
    typeof value === 'string' && CANONICAL_MEAL_PHOTO_PATH.test(value)
);

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

export const createMealPhotoResolver = ({ storage = supabase.storage, now = () => Date.now() } = {}) => {
    const cache = new Map();
    const inFlight = new Map();

    const resolve = async (photoPath, { forceRefresh = false } = {}) => {
        if (!isCanonicalMealPhotoPath(photoPath)) return placeholderResult();

        if (forceRefresh) cache.delete(photoPath);

        const cached = cache.get(photoPath);
        if (cached && cached.refreshAfter > now()) return cached.result;

        const existingRequest = inFlight.get(photoPath);
        if (existingRequest) return existingRequest;

        const request = (async () => {
            try {
                const { data, error } = await storage
                    .from(MEAL_PHOTO_BUCKET)
                    .createSignedUrl(photoPath, MEAL_PHOTO_SIGNED_URL_SECONDS);
                if (error || !data?.signedUrl) return placeholderResult(MealPhotoResolveStatus.ERROR);

                const result = {
                    photoUri: data.signedUrl,
                    status: MealPhotoResolveStatus.READY,
                };
                cache.set(photoPath, {
                    result,
                    refreshAfter: now() + MEAL_PHOTO_CACHE_MS,
                });
                return result;
            } catch {
                return placeholderResult(MealPhotoResolveStatus.ERROR);
            } finally {
                inFlight.delete(photoPath);
            }
        })();

        inFlight.set(photoPath, request);
        return request;
    };

    return {
        resolve,
        refresh: (photoPath) => resolve(photoPath, { forceRefresh: true }),
        clear: (photoPath) => {
            if (photoPath) cache.delete(photoPath);
            else cache.clear();
        },
    };
};

const resolver = createMealPhotoResolver();

export const resolveMealPhotoUri = (photoPath) => resolver.resolve(photoPath);
export const refreshMealPhotoUri = (photoPath) => resolver.refresh(photoPath);
