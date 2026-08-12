'use strict';

const normalizeSessionUserId = (userId) => (
    typeof userId === 'string' && userId.trim() ? userId : null
);

const hasMealSessionChanged = (previousUserId, nextUserId) => (
    normalizeSessionUserId(previousUserId) !== normalizeSessionUserId(nextUserId)
);

module.exports = { hasMealSessionChanged, normalizeSessionUserId };
