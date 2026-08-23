import Constants from 'expo-constants';
import { resolveEasProjectId as resolveEasProjectIdPolicy } from '../utils/pushClientPolicy.cjs';

export const resolveEasProjectId = ({ constants = Constants } = {}) => (
    resolveEasProjectIdPolicy(constants)
);

export const getPushAppInfo = ({ constants = Constants, platform } = {}) => ({
    platform: platform || null,
    appVersion: typeof constants?.nativeAppVersion === 'string'
        ? constants.nativeAppVersion.trim() || null
        : null,
    nativeBuildVersion: typeof constants?.nativeBuildVersion === 'string'
        ? constants.nativeBuildVersion.trim() || null
        : null,
});
