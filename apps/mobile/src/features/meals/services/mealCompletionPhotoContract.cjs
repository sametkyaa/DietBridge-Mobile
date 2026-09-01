'use strict';

const MEAL_COMPLETION_PHOTO_BUCKET = 'meal-completion-photos';
const MEAL_COMPLETION_PHOTO_MIME_TYPE = 'image/jpeg';
const MEAL_COMPLETION_PHOTO_MAX_BYTES = 4194304;
const UUID_PATTERN_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const MEAL_COMPLETION_PHOTO_PATH_PATTERN = new RegExp(
    `^${UUID_PATTERN_SOURCE}/${UUID_PATTERN_SOURCE}/${UUID_PATTERN_SOURCE}\\.jpg$`,
);

const isCanonicalMealCompletionPhotoPath = (value) => (
    typeof value === 'string' && MEAL_COMPLETION_PHOTO_PATH_PATTERN.test(value)
);

const buildMealCompletionPhotoPath = (clientId, mealId, objectId) => {
    if (![clientId, mealId, objectId].every((value) => (
        typeof value === 'string' && new RegExp(`^${UUID_PATTERN_SOURCE}$`).test(value)
    ))) {
        throw new Error('Invalid meal completion photo identity.');
    }
    return `${clientId}/${mealId}/${objectId}.jpg`;
};

const isMealCompletionPhotoSource = (value) => (
    Boolean(value)
    && typeof value === 'object'
    && typeof value.uri === 'string'
    && value.uri.length > 0
    && !isCanonicalMealCompletionPhotoPath(value.uri)
    && typeof value.mimeType === 'string'
);

module.exports = {
    MEAL_COMPLETION_PHOTO_BUCKET,
    MEAL_COMPLETION_PHOTO_MIME_TYPE,
    MEAL_COMPLETION_PHOTO_MAX_BYTES,
    MEAL_COMPLETION_PHOTO_PATH_PATTERN,
    isCanonicalMealCompletionPhotoPath,
    buildMealCompletionPhotoPath,
    isMealCompletionPhotoSource,
};
