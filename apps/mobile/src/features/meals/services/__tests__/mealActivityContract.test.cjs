'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    createMealActivityId,
    getMealActivityPhotoPath,
    isMealActivity,
    mergeMealActivities,
} = require('../../../chat/utils/mealActivityUtils');
const { buildChatTimeline } = require('../../../chat/utils/chatViewModelUtils');

const activity = (mealId, overrides = {}) => ({
    id: createMealActivityId(mealId),
    kind: 'meal_activity',
    relationId: '11111111-1111-4111-8111-111111111111',
    conversationId: '22222222-2222-4222-8222-222222222222',
    clientId: '33333333-3333-4333-8333-333333333333',
    dietitianId: '44444444-4444-4444-8444-444444444444',
    mealId,
    planId: '55555555-5555-4555-8555-555555555555',
    mealDate: '2026-08-14',
    mealType: 'breakfast',
    mealTitle: 'Kahvaltı tabağı',
    mealTime: '08:30',
    completedAt: '2026-08-14T05:42:00.000Z',
    createdAt: '2026-08-14T05:42:00.000Z',
    completionPhotoPath: null,
    mealPhotoPath: null,
    isHumanMessage: false,
    requiresRead: false,
    ...overrides,
});
test('one completed meal becomes one stable non-human activity', () => {
    const item = activity('66666666-6666-4666-8666-666666666666');
    assert.equal(isMealActivity(item), true);
    assert.equal(item.id, 'meal_activity:66666666-6666-4666-8666-666666666666');
    assert.equal(item.requiresRead, false);
});

test('late photo update replaces the same activity without duplication', () => {
    const mealId = '77777777-7777-4777-8777-777777777777';
    const first = activity(mealId);
    const updated = activity(mealId, { mealPhotoPath: 'meal-plans/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444/88888888-8888-4888-8888-888888888888.jpg' });
    const merged = mergeMealActivities([first], [updated]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].mealPhotoPath, updated.mealPhotoPath);
});

test('activity photo priority keeps provenance separate', () => {
    const completion = activity('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', {
        completionPhotoPath: '33333333-3333-4333-8333-333333333333/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/88888888-8888-4888-8888-888888888888.jpg',
        mealPhotoPath: 'recipes/44444444-4444-4444-8444-444444444444/image.jpg',
    });
    const snapshot = activity('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', {
        mealPhotoPath: 'recipes/44444444-4444-4444-8444-444444444444/image.jpg',
    });
    const empty = activity('cccccccc-cccc-4ccc-8ccc-cccccccccccc');

    assert.equal(isMealActivity(completion), true);
    assert.equal(getMealActivityPhotoPath(completion), completion.completionPhotoPath);
    assert.equal(getMealActivityPhotoPath(snapshot), snapshot.mealPhotoPath);
    assert.equal(getMealActivityPhotoPath(empty), null);
});

test('activity projection merges chronologically with human messages without entering read timeline semantics', () => {
    const human = {
        id: '99999999-9999-4999-8999-999999999999',
        conversationId: '22222222-2222-4222-8222-222222222222',
        senderId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        clientMessageId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        body: 'Merhaba',
        createdAt: '2026-08-14T05:43:00.000Z',
        deletedAt: null,
        deletedBy: null,
        isDeleted: false,
        isOwn: false,
        deliveryState: 'sent',
    };
    const item = activity('cccccccc-cccc-4ccc-8ccc-cccccccccccc');
    const timeline = buildChatTimeline([human], [], '11111111-1111-4111-8111-111111111111', [item]);
    assert.deepEqual(timeline.map((entry) => entry.kind || entry.id), [item.kind, human.id]);
    assert.equal(timeline.filter((entry) => entry.kind === 'meal_activity').length, 1);
});
