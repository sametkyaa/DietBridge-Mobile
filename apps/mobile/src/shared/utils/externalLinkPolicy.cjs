'use strict';

const TERMS_URL = 'https://dietbridge.com.tr/kullanim-kosullari';
const PRIVACY_URL = 'https://dietbridge.com.tr/gizlilik-politikasi';
const KVKK_URL = 'https://dietbridge.com.tr/kvkk';
const SUPPORT_EMAIL = 'dietbridge.official@gmail.com';
const SUPPORT_MAILTO_URL = `mailto:${SUPPORT_EMAIL}`;

const ALLOWED_EXTERNAL_TARGETS = new Set([
    TERMS_URL,
    PRIVACY_URL,
    KVKK_URL,
    SUPPORT_MAILTO_URL,
]);

const isAllowedExternalTarget = (target) => (
    typeof target === 'string' && ALLOWED_EXTERNAL_TARGETS.has(target)
);

const openExternalTarget = (target, dependencies) => openCheckedTarget(target, isAllowedExternalTarget, dependencies);

// Opens a target only when the given predicate accepts it. Fixed legal links
// use the allowlist above; dietitian social links use the directory rules.
const openCheckedTarget = async (target, isAllowed, dependencies) => {
    if (
        typeof isAllowed !== 'function'
        || !isAllowed(target)
        || !dependencies
        || typeof dependencies.canOpenURL !== 'function'
        || typeof dependencies.openURL !== 'function'
    ) {
        return false;
    }

    try {
        if (!(await dependencies.canOpenURL(target))) {
            throw new Error('External target is not supported on this device.');
        }

        await dependencies.openURL(target);
        return true;
    } catch (error) {
        dependencies.onFailure?.(error);
        return false;
    }
};

module.exports = {
    TERMS_URL,
    PRIVACY_URL,
    KVKK_URL,
    SUPPORT_EMAIL,
    SUPPORT_MAILTO_URL,
    isAllowedExternalTarget,
    openCheckedTarget,
    openExternalTarget,
};
