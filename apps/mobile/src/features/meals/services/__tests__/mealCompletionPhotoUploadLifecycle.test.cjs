'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    MEAL_COMPLETION_PHOTO_BUCKET,
    MEAL_COMPLETION_PHOTO_MIME_TYPE,
} = require('../mealCompletionPhotoContract.cjs');
const {
    uploadAndCompleteMealWithPhoto,
} = require('../mealCompletionPhotoUploadLifecycle.cjs');

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const MEAL_ID = '22222222-2222-4222-8222-222222222222';
const OBJECT_ID = '33333333-3333-4333-8333-333333333333';
const source = { uri: 'file:///picked.png', mimeType: 'image/png', width: 100, height: 100 };
const canonical = {
    uri: 'file:///canonical.jpg',
    body: new ArrayBuffer(8),
    byteSize: 8,
    mimeType: MEAL_COMPLETION_PHOTO_MIME_TYPE,
};

const createHarness = ({ uploadError = null, rpcResult = { data: true, error: null } } = {}) => {
    const calls = { uploads: [], rpcs: [], cleanup: [], queued: [] };
    const storage = {
        from: (bucket) => ({
            upload: async (path, body, options) => {
                calls.uploads.push({ bucket, path, body, options });
                return { error: uploadError };
            },
        }),
    };
    return {
        calls,
        storage,
        getUser: async () => ({ data: { user: { id: CLIENT_ID } }, error: null }),
        canonicalize: async () => canonical,
        canonicalizerDeps: { cleanup: async (uri) => calls.cleanup.push(uri) },
        randomUUID: () => OBJECT_ID,
        rpc: async (name, params) => {
            calls.rpcs.push({ name, params });
            return rpcResult;
        },
        enqueueCleanup: async (path) => calls.queued.push(path),
    };
};

test('upload success and completion RPC success returns the persisted path', async () => {
    const harness = createHarness();
    const result = await uploadAndCompleteMealWithPhoto({ ...harness, mealId: MEAL_ID, source });

    assert.equal(result.id, MEAL_ID);
    assert.equal(result.isEaten, true);
    assert.equal(result.completionPhotoPath, `${CLIENT_ID}/${MEAL_ID}/${OBJECT_ID}.jpg`);
    assert.deepEqual(harness.calls.uploads[0], {
        bucket: MEAL_COMPLETION_PHOTO_BUCKET,
        path: result.completionPhotoPath,
        body: canonical.body,
        options: { contentType: MEAL_COMPLETION_PHOTO_MIME_TYPE, upsert: false },
    });
    assert.deepEqual(harness.calls.rpcs, [{
        name: 'set_my_meal_completion_with_photo',
        params: {
            p_meal_id: MEAL_ID,
            p_is_eaten: true,
            p_completion_photo_url: result.completionPhotoPath,
        },
    }]);
    assert.deepEqual(harness.calls.queued, []);
    assert.deepEqual(harness.calls.cleanup, ['file:///canonical.jpg']);
});

test('upload failure does not call completion RPC and cleans the canonical temp file', async () => {
    const harness = createHarness({ uploadError: new Error('storage failure') });

    await assert.rejects(
        uploadAndCompleteMealWithPhoto({ ...harness, mealId: MEAL_ID, source }),
        (error) => error.code === 'upload_failed',
    );
    assert.equal(harness.calls.rpcs.length, 0);
    assert.deepEqual(harness.calls.queued, []);
    assert.deepEqual(harness.calls.cleanup, ['file:///canonical.jpg']);
});

test('completion RPC failure queues only the generated completion path for cleanup', async () => {
    const harness = createHarness({ rpcResult: { data: null, error: new Error('rpc failure') } });

    await assert.rejects(
        uploadAndCompleteMealWithPhoto({ ...harness, mealId: MEAL_ID, source }),
        (error) => error.code === 'completion_failed',
    );
    assert.deepEqual(harness.calls.queued, [`${CLIENT_ID}/${MEAL_ID}/${OBJECT_ID}.jpg`]);
    assert.deepEqual(harness.calls.cleanup, ['file:///canonical.jpg']);
});

test('picker cancellation or malformed source cannot reach Storage', async () => {
    const harness = createHarness();
    await assert.rejects(
        uploadAndCompleteMealWithPhoto({ ...harness, mealId: MEAL_ID, source: null }),
        (error) => error.code === 'invalid_request',
    );
    assert.equal(harness.calls.uploads.length, 0);
    assert.equal(harness.calls.rpcs.length, 0);
});

test('canonical output over the four MiB contract is rejected before upload', async () => {
    const harness = createHarness();
    harness.canonicalize = async () => ({ ...canonical, byteSize: 4 * 1024 * 1024 + 1 });

    await assert.rejects(
        uploadAndCompleteMealWithPhoto({ ...harness, mealId: MEAL_ID, source }),
        (error) => error.code === 'invalid_canonical_output',
    );
    assert.equal(harness.calls.uploads.length, 0);
});
