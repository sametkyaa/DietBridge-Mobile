'use strict';

const PRODUCTION_PASSWORD_RESET_URL = 'https://app.dietbridge.com.tr/reset-password';
const PASSWORD_RESET_CONFIGURATION_ERROR_MESSAGE = 'Şifre sıfırlama adresi yapılandırması geçersiz.';

const createConfigurationError = (code) => {
    const error = new Error(PASSWORD_RESET_CONFIGURATION_ERROR_MESSAGE);
    error.code = code;
    return error;
};

const normalizeConfiguredUrl = (configuredUrl) => (
    typeof configuredUrl === 'string' ? configuredUrl.trim() : ''
);

const isValidDevelopmentRedirectUrl = (configuredUrl) => {
    try {
        const parsedUrl = new URL(configuredUrl);
        return (
            ['http:', 'https:'].includes(parsedUrl.protocol)
            && parsedUrl.pathname === '/reset-password'
            && !parsedUrl.search
            && !parsedUrl.hash
            && !parsedUrl.username
            && !parsedUrl.password
        );
    } catch (_error) {
        return false;
    }
};

const resolvePasswordResetRedirectUrl = ({ configuredUrl, isDevelopment = false } = {}) => {
    const normalizedUrl = normalizeConfiguredUrl(configuredUrl);

    if (!normalizedUrl) {
        throw createConfigurationError('PASSWORD_RESET_URL_MISSING');
    }

    if (isDevelopment) {
        if (isValidDevelopmentRedirectUrl(normalizedUrl)) {
            return normalizedUrl;
        }

        throw createConfigurationError('PASSWORD_RESET_URL_INVALID_FOR_DEVELOPMENT');
    }

    if (normalizedUrl !== PRODUCTION_PASSWORD_RESET_URL) {
        throw createConfigurationError('PASSWORD_RESET_URL_INVALID_FOR_PRODUCTION');
    }

    return normalizedUrl;
};

module.exports = {
    PASSWORD_RESET_CONFIGURATION_ERROR_MESSAGE,
    PRODUCTION_PASSWORD_RESET_URL,
    resolvePasswordResetRedirectUrl,
};
