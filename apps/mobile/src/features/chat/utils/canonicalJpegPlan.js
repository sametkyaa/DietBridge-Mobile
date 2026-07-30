'use strict';

// Pure planning rules for the canonical JPEG-only chat image contract.
//
// The backend only ever accepts `image/jpeg` at most 2048 px on the longest
// edge, at most 4194304 total pixels and at most 4194304 bytes. Clients are
// therefore required to decode the picked file and re-encode it as a canonical
// JPEG *before* an upload intent is created.
//
// This module holds no native/Expo API: every decision is a pure function so
// the contract can be tested with Node's built-in runner without a device.

const {
    CHAT_IMAGE_JPEG_QUALITY_STEPS,
    CHAT_IMAGE_INITIAL_JPEG_QUALITY,
    CHAT_IMAGE_MAX_BYTES,
    CHAT_IMAGE_MAX_EDGE_PIXELS,
    CHAT_IMAGE_MAX_TOTAL_PIXELS,
    CHAT_IMAGE_MIME_TYPE,
    CHAT_IMAGE_OUTPUT_EXTENSION,
    CHAT_IMAGE_SOURCE_MIME_TYPES,
} = require('../constants/chatImageConstants');

const CHAT_IMAGE_OUTPUT_MIME_TYPE = CHAT_IMAGE_MIME_TYPE;

const isSupportedChatImageSourceMimeType = (value) => (
    typeof value === 'string' && CHAT_IMAGE_SOURCE_MIME_TYPES.includes(value)
);

// Dimensions must be finite, positive, safe integers. Zero, negative, NaN,
// Infinity and fractional values are rejected fail-closed.
const isValidSourceDimension = (value) => (
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 1
);

const isAcceptableCanonicalJpegSize = (byteSize) => (
    typeof byteSize === 'number'
    && Number.isSafeInteger(byteSize)
    && byteSize >= 1
    && byteSize <= CHAT_IMAGE_MAX_BYTES
);

// Returns the next lower quality step, or null when the ladder is exhausted.
// Callers use this to guarantee a terminating encode loop.
const resolveNextJpegQuality = (quality) => {
    const index = CHAT_IMAGE_JPEG_QUALITY_STEPS.indexOf(quality);
    if (index < 0 || index === CHAT_IMAGE_JPEG_QUALITY_STEPS.length - 1) return null;
    return CHAT_IMAGE_JPEG_QUALITY_STEPS[index + 1];
};

const scaleDimensions = (dimensions, scale) => ({
    width: Math.max(1, Math.floor(dimensions.width * scale)),
    height: Math.max(1, Math.floor(dimensions.height * scale)),
});

// Applies the longest-edge limit and the total-pixel limit together while
// preserving the aspect ratio. Both constraints are applied in sequence so a
// wide-but-short image cannot bypass the pixel budget.
const resolveCanonicalJpegDimensions = (source) => {
    if (!isValidSourceDimension(source.width) || !isValidSourceDimension(source.height)) {
        return null;
    }

    const longestEdge = Math.max(source.width, source.height);
    const edgeScale = longestEdge > CHAT_IMAGE_MAX_EDGE_PIXELS
        ? CHAT_IMAGE_MAX_EDGE_PIXELS / longestEdge
        : 1;
    const edgeConstrained = edgeScale === 1 ? source : scaleDimensions(source, edgeScale);

    const totalPixels = edgeConstrained.width * edgeConstrained.height;
    const pixelConstrained = totalPixels > CHAT_IMAGE_MAX_TOTAL_PIXELS
        ? scaleDimensions(edgeConstrained, Math.sqrt(CHAT_IMAGE_MAX_TOTAL_PIXELS / totalPixels))
        : edgeConstrained;

    // Flooring can only shrink, but the max(1, ...) clamp above means a
    // degenerate aspect ratio could still breach a limit. Reject instead of
    // shipping an out-of-contract image.
    if (
        pixelConstrained.width > CHAT_IMAGE_MAX_EDGE_PIXELS
        || pixelConstrained.height > CHAT_IMAGE_MAX_EDGE_PIXELS
        || pixelConstrained.width * pixelConstrained.height > CHAT_IMAGE_MAX_TOTAL_PIXELS
    ) {
        return null;
    }

    return pixelConstrained;
};

// Produces a plan describing the source, the constrained target, whether a
// resize is required, and the finite quality ladder. Returns a discriminated
// result: { ok: true, plan } or { ok: false, reason }.
const planCanonicalJpeg = (input) => {
    if (!isSupportedChatImageSourceMimeType(input.sourceMimeType)) {
        return { ok: false, reason: 'unsupported_type' };
    }
    if (!isValidSourceDimension(input.width) || !isValidSourceDimension(input.height)) {
        return { ok: false, reason: 'invalid_dimensions' };
    }

    const source = { width: input.width, height: input.height };
    const target = resolveCanonicalJpegDimensions(source);
    if (!target) return { ok: false, reason: 'invalid_dimensions' };

    return {
        ok: true,
        plan: {
            sourceMimeType: input.sourceMimeType,
            source,
            target,
            resizeRequired: target.width !== source.width || target.height !== source.height,
            qualitySteps: CHAT_IMAGE_JPEG_QUALITY_STEPS,
            outputMimeType: CHAT_IMAGE_OUTPUT_MIME_TYPE,
            outputExtension: CHAT_IMAGE_OUTPUT_EXTENSION,
            maxBytes: CHAT_IMAGE_MAX_BYTES,
        },
    };
};

module.exports = {
    CHAT_IMAGE_JPEG_QUALITY_STEPS,
    CHAT_IMAGE_INITIAL_JPEG_QUALITY,
    CHAT_IMAGE_OUTPUT_MIME_TYPE,
    CHAT_IMAGE_OUTPUT_EXTENSION,
    isSupportedChatImageSourceMimeType,
    isValidSourceDimension,
    isAcceptableCanonicalJpegSize,
    resolveNextJpegQuality,
    resolveCanonicalJpegDimensions,
    planCanonicalJpeg,
};
