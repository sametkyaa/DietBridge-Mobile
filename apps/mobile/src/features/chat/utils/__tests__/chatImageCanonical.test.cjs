'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const plan = require('../canonicalJpegPlan');
const { canonicalizeChatImage } = require('../canonicalizeChatImage');

// --- 1-8: canonical JPEG plan (pure) --------------------------------------

test('1. JPEG, PNG and WebP sources are accepted with JPEG output', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
        const result = plan.planCanonicalJpeg({ sourceMimeType: mime, width: 800, height: 600 });
        assert.equal(result.ok, true, mime);
        assert.equal(result.plan.sourceMimeType, mime);
        assert.equal(result.plan.outputMimeType, 'image/jpeg');
        assert.equal(result.plan.outputExtension, 'jpg');
    }
});

test('2. HEIC, GIF, SVG, PDF and unknown types are rejected as unsupported', () => {
    const rejected = ['image/heic', 'image/heif', 'image/gif', 'image/svg+xml', 'application/pdf', '', 'image/JPEG', null, undefined, 7];
    for (const mime of rejected) {
        const result = plan.planCanonicalJpeg({ sourceMimeType: mime, width: 800, height: 600 });
        assert.equal(result.ok, false, String(mime));
        assert.equal(result.reason, 'unsupported_type');
    }
});

test('3. the 2048 px longest-edge limit is applied', () => {
    const landscape = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: 6000, height: 3000 }).plan;
    assert.equal(landscape.target.width, 2048);
    assert.equal(landscape.target.height, 1024);
    assert.equal(landscape.resizeRequired, true);

    const portrait = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: 1000, height: 5000 }).plan;
    assert.equal(portrait.target.height, 2048);
    assert.ok(portrait.target.width <= 2048);

    const untouched = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: 2048, height: 2048 }).plan;
    assert.deepEqual(untouched.target, { width: 2048, height: 2048 });
    assert.equal(untouched.resizeRequired, false);
});

test('4. the total pixel budget is enforced on top of the edge limit', () => {
    const tall = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: 2048, height: 3000 }).plan;
    assert.ok(tall.target.width <= 2048 && tall.target.height <= 2048);
    assert.ok(tall.target.width * tall.target.height <= 4194304);

    const wide = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: 20000, height: 400 }).plan;
    assert.equal(wide.target.width, 2048);
    assert.ok(wide.target.width * wide.target.height <= 4194304);
});

test('5. the aspect ratio is preserved within a rounding budget', () => {
    const source = { width: 4032, height: 3024 };
    const target = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', ...source }).plan.target;
    const sourceRatio = source.width / source.height;
    const targetRatio = target.width / target.height;
    assert.ok(Math.abs(sourceRatio - targetRatio) < 0.01, `${sourceRatio} vs ${targetRatio}`);
});

test('6. zero, negative, fractional, NaN and Infinity dimensions are rejected', () => {
    const invalid = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '2048', null, undefined, Number.MAX_SAFE_INTEGER + 2];
    for (const value of invalid) {
        const byWidth = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: value, height: 100 });
        const byHeight = plan.planCanonicalJpeg({ sourceMimeType: 'image/jpeg', width: 100, height: value });
        assert.equal(byWidth.ok, false, `width ${String(value)}`);
        assert.equal(byWidth.reason, 'invalid_dimensions');
        assert.equal(byHeight.ok, false, `height ${String(value)}`);
        assert.equal(byHeight.reason, 'invalid_dimensions');
    }
});

test('7. the quality ladder is finite and ordered', () => {
    assert.deepEqual([...plan.CHAT_IMAGE_JPEG_QUALITY_STEPS], [0.82, 0.74, 0.66, 0.58]);
    assert.equal(plan.CHAT_IMAGE_INITIAL_JPEG_QUALITY, 0.82);
    assert.equal(plan.resolveNextJpegQuality(0.82), 0.74);
    assert.equal(plan.resolveNextJpegQuality(0.74), 0.66);
    assert.equal(plan.resolveNextJpegQuality(0.66), 0.58);
    assert.equal(plan.resolveNextJpegQuality(0.58), null, 'the ladder must terminate');
    assert.equal(plan.resolveNextJpegQuality(0.9), null);
});

test('8. only sizes within the 4 MiB budget are acceptable', () => {
    assert.equal(plan.isAcceptableCanonicalJpegSize(1), true);
    assert.equal(plan.isAcceptableCanonicalJpegSize(4194304), true);
    assert.equal(plan.isAcceptableCanonicalJpegSize(4194305), false);
    assert.equal(plan.isAcceptableCanonicalJpegSize(0), false);
    assert.equal(plan.isAcceptableCanonicalJpegSize(-1), false);
    assert.equal(plan.isAcceptableCanonicalJpegSize(1024.5), false);
});

// --- 9-16: canonicalizer adapter (deterministic fake deps) ----------------

const source = (mimeType = 'image/jpeg', overrides = {}) => ({
    uri: 'file:///tmp/source.img',
    mimeType,
    width: 4000,
    height: 3000,
    ...overrides,
});

const createFakeDeps = (options = {}) => {
    const log = { measured: 0, encoded: [], cleaned: [] };
    const sizes = options.sizes ?? [1000];
    let encodeIndex = 0;
    const deps = {
        measure: async (src) => {
            log.measured += 1;
            if (options.measureError) throw options.measureError;
            return { width: options.width ?? src.width, height: options.height ?? src.height };
        },
        encode: async (src, params) => {
            log.encoded.push(params.quality);
            if (options.encodeError) throw options.encodeError;
            const size = sizes[Math.min(encodeIndex, sizes.length - 1)];
            const uri = `file:///tmp/out-${encodeIndex}.jpg`;
            encodeIndex += 1;
            if (size === null) return { uri: null, byteSize: null };
            return { uri, byteSize: size, body: new ArrayBuffer(0), width: params.target.width, height: params.target.height };
        },
        cleanup: async (uri) => { log.cleaned.push(uri); },
    };
    return { deps, log };
};

test('9. the first acceptable quality wins and no further encode is attempted', async () => {
    const { deps, log } = createFakeDeps({ sizes: [1000] });
    const result = await canonicalizeChatImage(source('image/png'), { deps });
    assert.deepEqual(log.encoded, [0.82]);
    assert.equal(result.quality, 0.82);
    assert.equal(result.byteSize, 1000);
    assert.equal(result.mimeType, 'image/jpeg');
    assert.equal(result.width, 2048);
    assert.equal(result.height, 1536);
});

test('10. an oversized encode falls through to the next quality step', async () => {
    const { deps, log } = createFakeDeps({ sizes: [5000000, 4500000, 4000000] });
    const result = await canonicalizeChatImage(source('image/jpeg'), { deps });
    assert.deepEqual(log.encoded, [0.82, 0.74, 0.66]);
    assert.equal(result.quality, 0.66);
    assert.equal(result.byteSize, 4000000);
});

test('11. exhausting the ladder fails with output_too_large', async () => {
    const { deps, log } = createFakeDeps({ sizes: [9000000] });
    await assert.rejects(
        () => canonicalizeChatImage(source('image/jpeg'), { deps }),
        (error) => error.name === 'ChatImageError' && error.code === 'output_too_large',
    );
    assert.deepEqual(log.encoded, [0.82, 0.74, 0.66, 0.58], 'the loop must terminate');
});

test('12. an abort discards the late result and short-circuits a pre-aborted signal', async () => {
    const controller = new AbortController();
    const abortingDeps = createFakeDeps({ sizes: [1000] });
    const originalEncode = abortingDeps.deps.encode;
    abortingDeps.deps.encode = async (src, params) => {
        controller.abort();
        return originalEncode(src, params);
    };
    await assert.rejects(
        () => canonicalizeChatImage(source('image/jpeg'), { deps: abortingDeps.deps, signal: controller.signal }),
        (error) => error.name === 'ChatImageError' && error.code === 'aborted',
    );

    const preAborted = new AbortController();
    preAborted.abort();
    const fresh = createFakeDeps({ sizes: [1000] });
    await assert.rejects(
        () => canonicalizeChatImage(source('image/jpeg'), { deps: fresh.deps, signal: preAborted.signal }),
        (error) => error.code === 'aborted',
    );
    assert.deepEqual(fresh.log.encoded, [], 'an aborted signal short-circuits before measuring');
    assert.equal(fresh.log.measured, 0);
});

test('13. intermediate oversized temp files are cleaned up', async () => {
    const { deps, log } = createFakeDeps({ sizes: [9000000, 9000000, 1000] });
    const result = await canonicalizeChatImage(source('image/jpeg'), { deps });
    assert.equal(result.quality, 0.66);
    // The two oversized intermediates are cleaned; the winner is retained.
    assert.deepEqual(log.cleaned, ['file:///tmp/out-0.jpg', 'file:///tmp/out-1.jpg']);
});

test('14. a null encoder output is rejected instead of being uploaded', async () => {
    const { deps } = createFakeDeps({ sizes: [null] });
    await assert.rejects(
        () => canonicalizeChatImage(source('image/jpeg'), { deps }),
        (error) => error.code === 'decode_failed',
    );
});

test('15. an unsupported source MIME never reaches the encoder', async () => {
    const { deps, log } = createFakeDeps({ sizes: [1000] });
    await assert.rejects(
        () => canonicalizeChatImage(source('image/heic'), { deps }),
        (error) => error.code === 'unsupported_type',
    );
    assert.deepEqual(log.encoded, []);
});

test('16. invalid measured dimensions are rejected', async () => {
    const { deps } = createFakeDeps({ sizes: [1000], width: 0, height: 0 });
    await assert.rejects(
        () => canonicalizeChatImage(source('image/jpeg', { width: null, height: null }), { deps }),
        (error) => error.code === 'invalid_dimensions',
    );
});

test('17. a missing source uri or missing deps fails closed', async () => {
    const { deps } = createFakeDeps({ sizes: [1000] });
    await assert.rejects(
        () => canonicalizeChatImage({ mimeType: 'image/jpeg' }, { deps }),
        (error) => error.code === 'decode_failed',
    );
    await assert.rejects(
        () => canonicalizeChatImage(source('image/jpeg'), {}),
        (error) => error.code === 'feature_unavailable',
    );
});
