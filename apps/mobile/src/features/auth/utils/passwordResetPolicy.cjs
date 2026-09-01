'use strict';

const { NATIVE_PASSWORD_RECOVERY_URL } = require('./passwordRecoveryContract.cjs');

const resolvePasswordResetRedirectUrl = () => NATIVE_PASSWORD_RECOVERY_URL;

module.exports = {
    NATIVE_PASSWORD_RECOVERY_URL,
    resolvePasswordResetRedirectUrl,
};
