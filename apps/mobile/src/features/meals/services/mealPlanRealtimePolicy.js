'use strict';

// Pure, framework-free realtime policy for the meal plan screen.
// Written in CommonJS so Node's built-in test runner can exercise it without
// extra tooling; Metro/Babel consumes it unchanged inside the app bundle.

const REALTIME_EVENTS = ['INSERT', 'UPDATE', 'DELETE'];
const DEFAULT_DEBOUNCE_MS = 350;

// One stable channel per authenticated client. meal_plans events are filtered
// server-side by client ownership; meals rows carry no client_id, so those
// events arrive unfiltered and are matched client-side against loaded plan ids.
const buildMealPlanChannelConfig = (clientId) => ({
    channelName: `client-meal-plan:${clientId}`,
    subscriptions: [
        ...REALTIME_EVENTS.map((event) => ({
            table: 'meal_plans',
            event,
            filter: `client_id=eq.${clientId}`,
        })),
        ...REALTIME_EVENTS.map((event) => ({
            table: 'meals',
            event,
            filter: null,
        })),
    ],
});

const getPayloadRecords = (payload) => {
    if (!payload || typeof payload !== 'object') return [];

    const records = [];
    if (payload.new && typeof payload.new === 'object') records.push(payload.new);
    if (payload.old && typeof payload.old === 'object') records.push(payload.old);
    return records;
};

// A meal_plans change only matters for the open screen when it touches the
// currently loaded plan date. Payloads without plan_date (e.g. DELETE without
// REPLICA IDENTITY FULL) are indeterminate and fall back to a controlled refetch.
const isMealPlanEventRelevant = (payload, currentPlanDate) => {
    if (!currentPlanDate) return true;

    const planDates = getPayloadRecords(payload)
        .map((record) => record.plan_date)
        .filter((value) => typeof value === 'string' && value.length > 0);

    if (planDates.length === 0) return true;
    return planDates.includes(currentPlanDate);
};

// meals events are matched against the plan ids already loaded for the
// authenticated client. Payloads without plan_id (e.g. DELETE with default
// replica identity) are indeterminate and fall back to a controlled refetch.
const isMealEventRelevant = (payload, knownPlanIds) => {
    const planIds = knownPlanIds instanceof Set ? knownPlanIds : new Set(knownPlanIds || []);

    const payloadPlanIds = getPayloadRecords(payload)
        .map((record) => record.plan_id)
        .filter((value) => typeof value === 'string' && value.length > 0);

    if (payloadPlanIds.length === 0) return true;
    return payloadPlanIds.some((planId) => planIds.has(planId));
};

// Collapses a burst of realtime events into a single refresh: events within the
// debounce window reset the timer, only one refresh runs at a time, and events
// arriving mid-refresh schedule at most one trailing refresh.
const createRealtimeRefreshScheduler = ({ delayMs = DEFAULT_DEBOUNCE_MS, onRefresh } = {}) => {
    let timer = null;
    let inFlight = false;
    let trailingRequested = false;
    let disposed = false;

    const clearTimer = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const run = () => {
        if (disposed) return;
        if (inFlight) {
            trailingRequested = true;
            return;
        }
        if (typeof onRefresh !== 'function') return;

        inFlight = true;
        let refreshResult;
        try {
            refreshResult = onRefresh();
        } catch (error) {
            refreshResult = Promise.reject(error);
        }

        Promise.resolve(refreshResult)
            .catch(() => undefined)
            .then(() => {
                inFlight = false;
                if (trailingRequested) {
                    trailingRequested = false;
                    notify();
                }
            });
    };

    const notify = () => {
        if (disposed) return;
        clearTimer();
        timer = setTimeout(() => {
            timer = null;
            run();
        }, delayMs);
    };

    const clearPending = () => {
        clearTimer();
        trailingRequested = false;
    };

    const dispose = () => {
        disposed = true;
        clearPending();
    };

    return { notify, clearPending, dispose };
};

module.exports = {
    DEFAULT_DEBOUNCE_MS,
    REALTIME_EVENTS,
    buildMealPlanChannelConfig,
    createRealtimeRefreshScheduler,
    isMealEventRelevant,
    isMealPlanEventRelevant,
};
