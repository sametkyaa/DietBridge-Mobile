'use strict';

// Canonical JPEG-only chat image contract shared by the mobile client.
//
// These values mirror the dormant backend migrations authored for Web Package
// 2 (`20260729090000_chat_image_schema.sql`, `20260729090200_chat_image_rpc.sql`
// and `20260729090300_chat_image_storage.sql`). The client never widens them:
// anything outside this contract is rejected fail-closed while normalizing
// server rows or validating an upload target.

const CHAT_MESSAGE_KINDS = Object.freeze(['text', 'image']);

const CHAT_IMAGE_BUCKET_ID = 'chat-images';
const CHAT_IMAGE_MIME_TYPE = 'image/jpeg';
const CHAT_IMAGE_OUTPUT_EXTENSION = 'jpg';
const CHAT_IMAGE_MAX_BYTES = 4194304;
const CHAT_IMAGE_MAX_EDGE_PIXELS = 2048;
const CHAT_IMAGE_MAX_TOTAL_PIXELS = 4194304;
const CHAT_IMAGE_CAPTION_MAX_LENGTH = 4000;

// Source formats the system picker may hand over. The output is always JPEG.
const CHAT_IMAGE_SOURCE_MIME_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);

// Bounded quality ladder. The first step is the quality target; the remaining
// steps are only attempted when the previous encode exceeded the byte budget.
// The list is intentionally finite: there is no open-ended search loop.
const CHAT_IMAGE_JPEG_QUALITY_STEPS = Object.freeze([0.82, 0.74, 0.66, 0.58]);
const CHAT_IMAGE_INITIAL_JPEG_QUALITY = CHAT_IMAGE_JPEG_QUALITY_STEPS[0];

const UUID_PATTERN_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';

// Server-generated object path: `pending/<intent-uuid>/<object-uuid>.jpg`.
// Lowercase UUIDs and a lowercase `.jpg` extension only.
const CHAT_IMAGE_OBJECT_PATH_PATTERN = new RegExp(
    `^pending/${UUID_PATTERN_SOURCE}/${UUID_PATTERN_SOURCE}\\.jpg$`,
);

const isChatMessageKind = (value) => value === 'text' || value === 'image';

module.exports = {
    CHAT_MESSAGE_KINDS,
    CHAT_IMAGE_BUCKET_ID,
    CHAT_IMAGE_MIME_TYPE,
    CHAT_IMAGE_OUTPUT_EXTENSION,
    CHAT_IMAGE_MAX_BYTES,
    CHAT_IMAGE_MAX_EDGE_PIXELS,
    CHAT_IMAGE_MAX_TOTAL_PIXELS,
    CHAT_IMAGE_CAPTION_MAX_LENGTH,
    CHAT_IMAGE_SOURCE_MIME_TYPES,
    CHAT_IMAGE_JPEG_QUALITY_STEPS,
    CHAT_IMAGE_INITIAL_JPEG_QUALITY,
    CHAT_IMAGE_OBJECT_PATH_PATTERN,
    isChatMessageKind,
};
