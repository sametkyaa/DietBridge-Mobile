import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { resolveEasProjectId as resolveEasProjectIdPolicy } from '../utils/pushClientPolicy.cjs';

export const resolveEasProjectId = ({ constants = Constants } = {}) => (
    resolveEasProjectIdPolicy(constants)
);

export const getPushAppInfo = ({ constants = Constants, application = Application, platform } = {}) => ({
    platform: platform || null,
    appVersion: typeof (application.nativeApplicationVersion || constants?.expoConfig?.version) === 'string'
        ? (application.nativeApplicationVersion || constants.expoConfig.version).trim() || null
        : null,
    nativeBuildVersion: typeof application.nativeBuildVersion === 'string'
        ? application.nativeBuildVersion.trim() || null
        : null,
});
