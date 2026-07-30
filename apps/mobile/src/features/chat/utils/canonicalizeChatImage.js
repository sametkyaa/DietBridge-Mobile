'use strict';

// Pure orchestration that turns a picked JPEG/PNG/WebP into the canonical JPEG
// required by the dormant backend contract.
//
// Every native dependency is injected through `deps` so the whole adapter can
// be exercised from Node with deterministic fakes; no Expo import lives in this
// module. The real Expo-backed deps are assembled in
// `services/chatImagePicker.createExpoCanonicalizerDeps`.
//
// Metadata stripping is a consequence of the pipeline: the injected encoder
// re-encodes a fresh JPEG from decoded pixels, so no EXIF/ICC/XMP segment
// survives the round-trip.
//
// deps contract:
//   measure(source) -> Promise<{ width, height }>
//   encode(source, { target, quality, resizeRequired }) -> Promise<{ uri, byteSize, body }>
//   cleanup(uri) -> Promise<void> | void   // best-effort temp-file removal

const {
    CHAT_IMAGE_JPEG_QUALITY_STEPS,
    CHAT_IMAGE_OUTPUT_MIME_TYPE,
    isAcceptableCanonicalJpegSize,
    planCanonicalJpeg,
} = require('./canonicalJpegPlan');
const { ChatImageError, createChatImageError } = require('./chatImageError');

const throwIfAborted = (signal) => {
    if (signal && signal.aborted) throw createChatImageError('aborted');
};

const toChatImageError = (error) => (
    error instanceof ChatImageError ? error : createChatImageError('decode_failed', { cause: error })
);

// Produces the canonical JPEG descriptor for `source`, or throws a
// ChatImageError. The quality ladder is finite and ordered; the first encode at
// or below the byte budget wins. When every step is still too large the caller
// gets `output_too_large` instead of an unbounded search. Intermediate encode
// outputs are cleaned up so only the winning temp file survives.
const canonicalizeChatImage = async (source, options = {}) => {
    const { signal, deps } = options;
    throwIfAborted(signal);

    if (!source || typeof source.uri !== 'string' || !source.uri) {
        throw createChatImageError('decode_failed');
    }
    if (!deps || typeof deps.measure !== 'function' || typeof deps.encode !== 'function') {
        throw createChatImageError('feature_unavailable');
    }

    const cleanup = async (uri) => {
        if (!uri || typeof deps.cleanup !== 'function') return;
        try {
            await deps.cleanup(uri);
        } catch {
            // Cleanup must never mask the surrounding outcome.
        }
    };

    try {
        const measured = await deps.measure(source);
        throwIfAborted(signal);

        const width = measured && Number.isFinite(measured.width) ? measured.width : source.width;
        const height = measured && Number.isFinite(measured.height) ? measured.height : source.height;

        const planned = planCanonicalJpeg({ sourceMimeType: source.mimeType, width, height });
        if (!planned.ok || !planned.plan) {
            throw createChatImageError(planned.reason || 'invalid_dimensions');
        }
        const plan = planned.plan;

        let lastRejectedUri = null;
        for (const quality of CHAT_IMAGE_JPEG_QUALITY_STEPS) {
            throwIfAborted(signal);
            const encoded = await deps.encode(source, {
                target: plan.target,
                quality,
                resizeRequired: plan.resizeRequired,
            });
            throwIfAborted(signal);

            if (!encoded || typeof encoded.uri !== 'string' || !encoded.uri) {
                throw createChatImageError('decode_failed');
            }

            if (!isAcceptableCanonicalJpegSize(encoded.byteSize)) {
                await cleanup(lastRejectedUri);
                lastRejectedUri = encoded.uri;
                continue;
            }

            await cleanup(lastRejectedUri);
            return {
                uri: encoded.uri,
                body: encoded.body,
                byteSize: encoded.byteSize,
                quality,
                width: plan.target.width,
                height: plan.target.height,
                mimeType: CHAT_IMAGE_OUTPUT_MIME_TYPE,
            };
        }

        await cleanup(lastRejectedUri);
        throw createChatImageError('output_too_large');
    } catch (error) {
        throw toChatImageError(error);
    }
};

module.exports = { canonicalizeChatImage };
