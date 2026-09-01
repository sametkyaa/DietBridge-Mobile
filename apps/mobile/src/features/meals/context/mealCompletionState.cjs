'use strict';

const { isCanonicalMealCompletionPhotoPath } = require('../services/mealCompletionPhotoContract.cjs');

const emptyCompletionState = (completed = false) => ({
    completed,
    completionPhotoPath: null,
    localCompletionPhotoUri: null,
});

const hydrateMealCompletionState = (meal, current = null) => {
    if (!meal?.isEaten) return null;
    return {
        completed: true,
        completionPhotoPath: isCanonicalMealCompletionPhotoPath(meal.completionPhotoPath)
            ? meal.completionPhotoPath
            : null,
        localCompletionPhotoUri: typeof current?.localCompletionPhotoUri === 'string'
            ? current.localCompletionPhotoUri
            : null,
    };
};

const createOptimisticMealCompletionState = (shouldComplete, source = null) => (
    shouldComplete
        ? {
            completed: true,
            completionPhotoPath: null,
            localCompletionPhotoUri: typeof source?.uri === 'string' ? source.uri : null,
        }
        : emptyCompletionState(false)
);

const createFinalMealCompletionState = (shouldComplete, completionPhotoPath = null) => (
    shouldComplete
        ? {
            completed: true,
            completionPhotoPath: isCanonicalMealCompletionPhotoPath(completionPhotoPath)
                ? completionPhotoPath
                : null,
            localCompletionPhotoUri: null,
        }
        : emptyCompletionState(false)
);

module.exports = {
    emptyCompletionState,
    hydrateMealCompletionState,
    createOptimisticMealCompletionState,
    createFinalMealCompletionState,
};
