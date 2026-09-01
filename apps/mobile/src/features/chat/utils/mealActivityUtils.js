'use strict';

const { isValidUuid, normalizeIsoTimestamp } = require('./chatMessageUtils');

const MEAL_ACTIVITY_KIND = 'meal_activity';

const createMealActivityId = (mealId) => `meal_activity:${mealId}`;

const isMealActivity = (value) => Boolean(value)
    && typeof value === 'object'
    && value.kind === MEAL_ACTIVITY_KIND
    && typeof value.id === 'string'
    && value.id === createMealActivityId(value.mealId)
    && isValidUuid(value.relationId)
    && isValidUuid(value.conversationId)
    && isValidUuid(value.clientId)
    && isValidUuid(value.dietitianId)
    && isValidUuid(value.mealId)
    && isValidUuid(value.planId)
    && typeof value.mealDate === 'string'
    && typeof value.mealType === 'string'
    && typeof value.mealTitle === 'string'
    && typeof value.mealTime === 'string'
    && normalizeIsoTimestamp(value.completedAt) !== null
    && value.createdAt === value.completedAt
    && (value.completionPhotoPath === null || typeof value.completionPhotoPath === 'string')
    && (value.mealPhotoPath === null || typeof value.mealPhotoPath === 'string')
    && value.isHumanMessage === false
    && value.requiresRead === false;

const getMealActivityPhotoPath = (activity) => (
    activity?.completionPhotoPath || activity?.mealPhotoPath || null
);

const compareMealActivities = (left, right) => {
    const timeDifference = Date.parse(left.createdAt) - Date.parse(right.createdAt);
    if (timeDifference !== 0) return timeDifference;
    return left.id.localeCompare(right.id);
};
const mergeMealActivities = (existingActivities, incomingActivities) => {
    const byMealId = new Map();
    [...(Array.isArray(existingActivities) ? existingActivities : []), ...(Array.isArray(incomingActivities) ? incomingActivities : [])]
        .forEach((activity) => {
            if (isMealActivity(activity)) byMealId.set(activity.mealId, activity);
        });
    return [...byMealId.values()].sort(compareMealActivities);
};

module.exports = {
    MEAL_ACTIVITY_KIND,
    createMealActivityId,
    isMealActivity,
    getMealActivityPhotoPath,
    compareMealActivities,
    mergeMealActivities,
};
