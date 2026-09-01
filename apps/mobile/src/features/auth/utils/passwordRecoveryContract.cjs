'use strict';

const NATIVE_PASSWORD_RECOVERY_URL = 'dietbridge://reset-password';
const PASSWORD_RECOVERY_INVALID_MESSAGE =
    'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin.';

const ERROR_PARAMETER_NAMES = new Set([
    'error',
    'error_code',
    'error_description',
    'error_reason',
    'error_uri',
]);

const INVALID_RECOVERY_CODES = Object.freeze({
    INVALID_URL: 'PASSWORD_RECOVERY_URL_INVALID',
    UNRELATED_LINK: 'PASSWORD_RECOVERY_LINK_UNRELATED',
    MALFORMED_PAYLOAD: 'PASSWORD_RECOVERY_PAYLOAD_MALFORMED',
    ERROR_CALLBACK: 'PASSWORD_RECOVERY_CALLBACK_ERROR',
    MISSING_TOKEN: 'PASSWORD_RECOVERY_TOKEN_MISSING',
    DUPLICATE_TOKEN: 'PASSWORD_RECOVERY_TOKEN_DUPLICATE',
    INVALID_TYPE: 'PASSWORD_RECOVERY_TYPE_INVALID',
    UNSUPPORTED_FLOW: 'PASSWORD_RECOVERY_FLOW_UNSUPPORTED',
});

const createFailure = (code) => ({
    ok: false,
    code,
    message: PASSWORD_RECOVERY_INVALID_MESSAGE,
});

const parseUrl = (value) => {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
        return new URL(value.trim());
    } catch (_error) {
        return null;
    }
};

const isNativePasswordRecoveryDestination = (value) => {
    const parsedUrl = parseUrl(value);

    return Boolean(
        parsedUrl
        && parsedUrl.protocol === 'dietbridge:'
        && parsedUrl.hostname === 'reset-password'
        && parsedUrl.pathname === ''
        && !parsedUrl.port
        && !parsedUrl.username
        && !parsedUrl.password,
    );
};

const hasMalformedPercentEncoding = (value) => /%(?![0-9a-f]{2})/i.test(value);

const getPayloadParameters = (parsedUrl) => {
    const rawQuery = parsedUrl.search.slice(1);
    const rawHash = parsedUrl.hash.slice(1);

    if (hasMalformedPercentEncoding(rawQuery) || hasMalformedPercentEncoding(rawHash)) {
        return { error: INVALID_RECOVERY_CODES.MALFORMED_PAYLOAD };
    }

    try {
        const queryParameters = new URLSearchParams(rawQuery);
        const hashParameters = new URLSearchParams(rawHash);
        const allParameters = [...queryParameters.entries(), ...hashParameters.entries()];

        if (allParameters.some(([name]) => ERROR_PARAMETER_NAMES.has(name))) {
            return { error: INVALID_RECOVERY_CODES.ERROR_CALLBACK };
        }

        if (allParameters.some(([name]) => name === 'code')) {
            return { error: INVALID_RECOVERY_CODES.UNSUPPORTED_FLOW };
        }

        return { queryParameters, hashParameters };
    } catch (_error) {
        return { error: INVALID_RECOVERY_CODES.MALFORMED_PAYLOAD };
    }
};

const readSingleParameter = (name, queryParameters, hashParameters) => {
    const values = [
        ...queryParameters.getAll(name),
        ...hashParameters.getAll(name),
    ];

    if (values.length === 0) return { error: INVALID_RECOVERY_CODES.MISSING_TOKEN };
    if (values.length > 1) return { error: INVALID_RECOVERY_CODES.DUPLICATE_TOKEN };
    if (!values[0] || !values[0].trim()) return { error: INVALID_RECOVERY_CODES.MISSING_TOKEN };

    return { value: values[0] };
};

const parsePasswordRecoveryUrl = (value) => {
    const parsedUrl = parseUrl(value);

    if (!parsedUrl) return createFailure(INVALID_RECOVERY_CODES.INVALID_URL);
    if (!isNativePasswordRecoveryDestination(value)) {
        return createFailure(INVALID_RECOVERY_CODES.UNRELATED_LINK);
    }

    const payload = getPayloadParameters(parsedUrl);
    if (payload.error) return createFailure(payload.error);

    const type = readSingleParameter('type', payload.queryParameters, payload.hashParameters);
    if (type.error) return createFailure(type.error);
    if (type.value !== 'recovery') return createFailure(INVALID_RECOVERY_CODES.INVALID_TYPE);

    const accessToken = readSingleParameter(
        'access_token',
        payload.queryParameters,
        payload.hashParameters,
    );
    const refreshToken = readSingleParameter(
        'refresh_token',
        payload.queryParameters,
        payload.hashParameters,
    );

    if (accessToken.error) return createFailure(accessToken.error);
    if (refreshToken.error) return createFailure(refreshToken.error);

    return {
        ok: true,
        accessToken: accessToken.value,
        refreshToken: refreshToken.value,
        type: type.value,
    };
};

module.exports = {
    INVALID_RECOVERY_CODES,
    NATIVE_PASSWORD_RECOVERY_URL,
    PASSWORD_RECOVERY_INVALID_MESSAGE,
    isNativePasswordRecoveryDestination,
    parsePasswordRecoveryUrl,
};
