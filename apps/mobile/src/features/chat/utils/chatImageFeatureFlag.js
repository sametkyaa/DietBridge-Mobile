'use strict';

// Fail-closed feature flag for mobile chat image sending.
//
// The visual RPCs are dormant in production (no `authenticated` grant), so the
// composer picker must default to off. The flag only enables the *sending*
// surface; it never gates the read path and never substitutes for a security
// check. A valid image message written by another client is still normalized
// and rendered as a safe placeholder regardless of this flag.

const CHAT_IMAGES_FEATURE_FLAG = 'EXPO_PUBLIC_ENABLE_CHAT_IMAGES';

// Pure predicate: the flag is enabled only when the value is exactly the
// string 'true'. Missing, empty, differently-cased or any other value is off.
const isChatImagesFeatureEnabledValue = (value) => value === 'true';

// Runtime reader. Expo inlines `process.env.EXPO_PUBLIC_*` at build time, so
// this is evaluated against the compiled constant, not a dynamic lookup.
const isChatImagesFeatureEnabled = () => (
    isChatImagesFeatureEnabledValue(process.env.EXPO_PUBLIC_ENABLE_CHAT_IMAGES)
);

module.exports = {
    CHAT_IMAGES_FEATURE_FLAG,
    isChatImagesFeatureEnabledValue,
    isChatImagesFeatureEnabled,
};
