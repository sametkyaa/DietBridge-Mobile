export const PUSH_INSTALLATION_STORAGE_KEY = '@dietbridge/push/installation-id';

export const PUSH_CHANNEL_IDS = Object.freeze({
    SILENT: 'dietbridge-silent',
    APPOINTMENTS: 'dietbridge-appointments',
});

export const PUSH_CAPABILITY_STATUS = Object.freeze({
    UNSUPPORTED_RUNTIME: 'unsupported_runtime',
    CONFIGURATION_MISSING: 'configuration_missing',
    PERMISSION_NOT_DETERMINED: 'permission_not_determined',
    PERMISSION_DENIED: 'permission_denied',
    PERMISSION_GRANTED: 'permission_granted',
    TOKEN_UNAVAILABLE: 'token_unavailable',
    REGISTRATION_FAILED: 'registration_failed',
    REGISTERED: 'registered',
    REVOKED: 'revoked',
    UNAUTHENTICATED: 'unauthenticated',
    SESSION_CHANGED: 'session_changed',
});

export const PUSH_PERMISSION_STATUS = Object.freeze({
    NOT_DETERMINED: PUSH_CAPABILITY_STATUS.PERMISSION_NOT_DETERMINED,
    DENIED: PUSH_CAPABILITY_STATUS.PERMISSION_DENIED,
    GRANTED: PUSH_CAPABILITY_STATUS.PERMISSION_GRANTED,
});
