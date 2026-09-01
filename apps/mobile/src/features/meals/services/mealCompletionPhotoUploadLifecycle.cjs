'use strict';

const {
    MEAL_COMPLETION_PHOTO_BUCKET,
    MEAL_COMPLETION_PHOTO_MAX_BYTES,
    MEAL_COMPLETION_PHOTO_MIME_TYPE,
    buildMealCompletionPhotoPath,
    isMealCompletionPhotoSource,
} = require('./mealCompletionPhotoContract.cjs');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const createCompletionPhotoError = (code, cause) => {
    const error = new Error('Meal completion photo operation failed.');
    error.code = code;
    if (cause) error.cause = cause;
    return error;
};

const readAuthenticatedUser = async (getUser) => {
    let result;
    try {
        result = await getUser();
    } catch (error) {
        throw createCompletionPhotoError('unauthorized', error);
    }
    if (result?.error || !result?.data?.user?.id) {
        throw createCompletionPhotoError('unauthorized');
    }
    return result.data.user;
};

const validateCanonicalOutput = (canonical) => {
    if (!canonical
        || canonical.mimeType !== MEAL_COMPLETION_PHOTO_MIME_TYPE
        || typeof canonical.uri !== 'string'
        || !canonical.uri
        || !Number.isSafeInteger(canonical.byteSize)
        || canonical.byteSize < 1
        || canonical.byteSize > MEAL_COMPLETION_PHOTO_MAX_BYTES
        || canonical.body === null
        || canonical.body === undefined) {
        throw createCompletionPhotoError('invalid_canonical_output');
    }
};

// Orchestrates the non-atomic local canonicalization -> Storage upload -> RPC
// sequence. All side effects are injected so the failure and cleanup paths can
// be tested without importing Expo or Supabase in Node.
const uploadAndCompleteMealWithPhoto = async ({
    mealId,
    source,
    getUser,
    canonicalize,
    canonicalizerDeps,
    randomUUID,
    storage,
    rpc,
    enqueueCleanup,
} = {}) => {
    if (!isMealCompletionPhotoSource(source)
        || typeof mealId !== 'string'
        || !UUID_PATTERN.test(mealId)) {
        throw createCompletionPhotoError('invalid_request');
    }
    if (typeof getUser !== 'function'
        || typeof canonicalize !== 'function'
        || typeof randomUUID !== 'function'
        || !storage
        || typeof storage.from !== 'function'
        || typeof rpc !== 'function') {
        throw createCompletionPhotoError('feature_unavailable');
    }

    let canonical;
    try {
        canonical = await canonicalize(source, { deps: canonicalizerDeps });
        validateCanonicalOutput(canonical);
    } catch (error) {
        if (error?.code) throw error;
        throw createCompletionPhotoError('canonicalization_failed', error);
    }

    let objectPath;
    try {
        const user = await readAuthenticatedUser(getUser);
        objectPath = buildMealCompletionPhotoPath(user.id, mealId, randomUUID());

        let uploadResult;
        try {
            uploadResult = await storage
                .from(MEAL_COMPLETION_PHOTO_BUCKET)
                .upload(objectPath, canonical.body, {
                    contentType: MEAL_COMPLETION_PHOTO_MIME_TYPE,
                    upsert: false,
                });
        } catch (error) {
            throw createCompletionPhotoError('upload_failed', error);
        }
        const uploadError = uploadResult?.error;
        if (uploadError) throw createCompletionPhotoError('upload_failed', uploadError);

        let completionResult;
        try {
            completionResult = await rpc('set_my_meal_completion_with_photo', {
                p_meal_id: mealId,
                p_is_eaten: true,
                p_completion_photo_url: objectPath,
            });
        } catch (error) {
            completionResult = { error };
        }

        if (completionResult?.error || completionResult?.data !== true) {
            if (typeof enqueueCleanup === 'function') {
                try {
                    await enqueueCleanup(objectPath);
                } catch {
                    // The server-side cleanup queue is best effort here. The
                    // failed completion must remain a failed completion.
                }
            }
            throw createCompletionPhotoError('completion_failed', completionResult?.error);
        }

        return {
            id: mealId,
            isEaten: true,
            completionPhotoPath: objectPath,
        };
    } finally {
        try {
            await canonicalizerDeps?.cleanup?.(canonical.uri);
        } catch {
            // Local cache cleanup must never change the DB outcome.
        }
    }
};

module.exports = {
    createCompletionPhotoError,
    uploadAndCompleteMealWithPhoto,
};
