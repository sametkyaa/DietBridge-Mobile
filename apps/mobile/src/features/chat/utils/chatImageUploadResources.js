'use strict';

// Resources owned by exactly one upload operation.
//
// The hook deliberately keeps this object on the operation rather than in a
// shared ref. A stale promise can therefore only release its own intent,
// canonical blob and preview URI; it has no handle to a newer operation.
//
// Shape: {
//   canonical: CanonicalChatImage | null,
//   intent: ChatImageUploadIntent | null,
//   previewUri: string | null,
//   intentReleased: boolean,
//   finalized: boolean,
// }

// Takes ownership of the preview URI for one cleanup call.
const takeChatImagePreviewUri = (resources) => {
    const previewUri = resources.previewUri;
    resources.previewUri = null;
    return previewUri;
};

// Takes ownership of this operation's intent for one best-effort abort.
const takeChatImageIntentForAbort = (resources) => {
    if (resources.finalized || resources.intentReleased || !resources.intent) return null;
    const intentId = resources.intent.id;
    resources.intentReleased = true;
    resources.intent = null;
    return intentId;
};

const clearChatImageCanonical = (resources) => {
    resources.canonical = null;
};

// Marks a finalized operation terminal before any later cleanup can run.
const finalizeChatImageResources = (resources) => {
    resources.finalized = true;
    resources.intentReleased = true;
    resources.intent = null;
    resources.canonical = null;
};

module.exports = {
    takeChatImagePreviewUri,
    takeChatImageIntentForAbort,
    clearChatImageCanonical,
    finalizeChatImageResources,
};
