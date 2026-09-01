'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    MEAL_COMPLETION_PHOTO_BUCKET,
    MEAL_COMPLETION_PHOTO_MAX_BYTES,
    MEAL_COMPLETION_PHOTO_MIME_TYPE,
    buildMealCompletionPhotoPath,
    isCanonicalMealCompletionPhotoPath,
    isMealCompletionPhotoSource,
} = require('../mealCompletionPhotoContract.cjs');
const {
    createFinalMealCompletionState,
    createOptimisticMealCompletionState,
    hydrateMealCompletionState,
} = require('../../context/mealCompletionState.cjs');

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const MEAL_ID = '22222222-2222-4222-8222-222222222222';
const OBJECT_ID = '33333333-3333-4333-8333-333333333333';
const PATH = `${CLIENT_ID}/${MEAL_ID}/${OBJECT_ID}.jpg`;

test('completion photo contract is private JPEG and uses an unpredictable meal-owned path', () => {
    assert.equal(MEAL_COMPLETION_PHOTO_BUCKET, 'meal-completion-photos');
    assert.equal(MEAL_COMPLETION_PHOTO_MIME_TYPE, 'image/jpeg');
    assert.equal(MEAL_COMPLETION_PHOTO_MAX_BYTES, 4 * 1024 * 1024);
    assert.equal(buildMealCompletionPhotoPath(CLIENT_ID, MEAL_ID, OBJECT_ID), PATH);
    assert.equal(isCanonicalMealCompletionPhotoPath(PATH), true);
    assert.equal(isCanonicalMealCompletionPhotoPath(`${CLIENT_ID}/${MEAL_ID}/${OBJECT_ID}.png`), false);
    assert.equal(isCanonicalMealCompletionPhotoPath(`meal-completion-photos/${PATH}`), false);
    assert.equal(isCanonicalMealCompletionPhotoPath(PATH.toUpperCase()), false);
});

test('picker source must be a local URI descriptor, never a Storage path', () => {
    assert.equal(isMealCompletionPhotoSource({ uri: 'file:///photo.jpg', mimeType: 'image/jpeg' }), true);
    assert.equal(isMealCompletionPhotoSource({ uri: PATH, mimeType: 'image/jpeg' }), false);
    assert.equal(isMealCompletionPhotoSource(PATH), false);
    assert.equal(isMealCompletionPhotoSource(null), false);
});

test('hydration restores persisted completion photo while retaining an in-flight local draft', () => {
    assert.deepEqual(
        hydrateMealCompletionState({ isEaten: true, completionPhotoPath: PATH }, {
            localCompletionPhotoUri: 'file:///draft.jpg',
        }),
        {
            completed: true,
            completionPhotoPath: PATH,
            localCompletionPhotoUri: 'file:///draft.jpg',
        },
    );
});

test('undo and no-photo re-completion clear both persisted and local photo state', () => {
    assert.deepEqual(createFinalMealCompletionState(false, PATH), {
        completed: false,
        completionPhotoPath: null,
        localCompletionPhotoUri: null,
    });
    assert.deepEqual(createFinalMealCompletionState(true, null), {
        completed: true,
        completionPhotoPath: null,
        localCompletionPhotoUri: null,
    });
    assert.deepEqual(createOptimisticMealCompletionState(true, { uri: 'file:///draft.jpg' }), {
        completed: true,
        completionPhotoPath: null,
        localCompletionPhotoUri: 'file:///draft.jpg',
    });
});
