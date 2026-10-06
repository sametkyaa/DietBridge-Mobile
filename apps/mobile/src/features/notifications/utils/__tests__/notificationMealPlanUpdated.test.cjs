'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildNotificationRow } = require('./notificationTestFixtures.cjs');
const { normalizeNotificationRow, partitionNotificationRows } = require('../notificationUtils');
const { formatNotificationSummary, getNotificationCategoryIcon } = require('../notificationUiUtils.cjs');
const { getNotificationNavigationIntent } = require('../notificationNavigationPolicy.cjs');
const { resolveNotificationDestinationWithDependencies } = require('../notificationNavigationResolver.cjs');

const RELATION_ID = '77777777-7777-4777-8777-777777777777';

const buildMealPlanRow = (overrides = {}) => buildNotificationRow({
    category: 'meal_plan',
    event_type: 'updated',
    summary_key: 'meal_plan_updated',
    aggregation_key: `meal_plan:${RELATION_ID}:2026-10-05`,
    conversation_id: null,
    dietitian_client_id: RELATION_ID,
    event_count: 1,
    ...overrides,
});

test('meal_plan/updated rows are normalized as a supported notification', () => {
    const notification = normalizeNotificationRow(buildMealPlanRow());
    assert.ok(notification);
    assert.equal(notification.category, 'meal_plan');
    assert.equal(notification.dietitianClientId, RELATION_ID);
    assert.equal(partitionNotificationRows([buildMealPlanRow()]).unsupportedCount, 0);
});

test('meal_plan/updated rows with a wrong shape are rejected as malformed', () => {
    assert.equal(normalizeNotificationRow(buildMealPlanRow({ dietitian_client_id: null })), null);
    assert.equal(normalizeNotificationRow(buildMealPlanRow({ summary_key: 'appointment_updated' })), null);
    assert.equal(normalizeNotificationRow(buildMealPlanRow({ conversation_id: '22222222-2222-4222-8222-222222222222' })), null);
    assert.equal(normalizeNotificationRow(buildMealPlanRow({ event_type: 'created' })), null);
});

test('meal_plan/updated copy names the dietitian when available', () => {
    const notification = normalizeNotificationRow(buildMealPlanRow());
    assert.equal(formatNotificationSummary(notification), 'Mebrure Kaya beslenme planınızı güncelledi.');
    assert.equal(
        formatNotificationSummary({ ...notification, actorDisplayName: null }),
        'Beslenme planınız güncellendi.',
    );
    assert.equal(getNotificationCategoryIcon('meal_plan'), 'meal');
});

test('meal_plan/updated opens the meal plan only for the current active relationship', async () => {
    const notification = normalizeNotificationRow(buildMealPlanRow());
    assert.deepEqual(getNotificationNavigationIntent(notification), { kind: 'mealPlan' });

    const active = await resolveNotificationDestinationWithDependencies({
        notification,
        activeConnection: { id: RELATION_ID, status: 'active' },
    });
    assert.deepEqual(active, { kind: 'mealPlan' });

    const otherRelation = await resolveNotificationDestinationWithDependencies({
        notification,
        activeConnection: { id: '88888888-8888-4888-8888-888888888888', status: 'active' },
    });
    assert.equal(otherRelation.kind, 'invalid');

    const disconnected = await resolveNotificationDestinationWithDependencies({ notification, activeConnection: null });
    assert.equal(disconnected.kind, 'invalid');
});

test('the meal_plan select stays compatible with backends without the new notification columns', () => {
    const { NOTIFICATION_SELECT_COLUMNS } = require('../../constants/notificationConstants');
    assert.doesNotMatch(NOTIFICATION_SELECT_COLUMNS, /activity_date|meal_id|meal_change_request_id/);
});
