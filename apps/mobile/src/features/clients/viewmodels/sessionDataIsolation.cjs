'use strict';

const normalizeSessionUserId = (userId) => (
    typeof userId === 'string' && userId.trim() ? userId : null
);

const hasSessionChanged = (previousUserId, nextUserId) => (
    normalizeSessionUserId(previousUserId) !== normalizeSessionUserId(nextUserId)
);

module.exports = { hasSessionChanged, normalizeSessionUserId };
