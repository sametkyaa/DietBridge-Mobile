import { Alert } from './errorAlert';
import { Linking } from 'react-native';
import {
  SUPPORT_MAILTO_URL,
  openCheckedTarget,
  openExternalTarget,
} from './externalLinkPolicy.cjs';

const LINK_FAILURE_TITLE = 'Bağlantı açılamadı';
const LINK_FAILURE_MESSAGE = 'Bu bağlantı cihazınızda açılamadı. Lütfen daha sonra tekrar deneyin.';

const linkingDependencies = {
  canOpenURL: (value) => Linking.canOpenURL(value),
  openURL: (value) => Linking.openURL(value),
  onFailure: () => Alert.alert(LINK_FAILURE_TITLE, LINK_FAILURE_MESSAGE),
};

export function openExternalLink(target) {
  return openExternalTarget(target, linkingDependencies);
}

// For links that are validated by a caller-supplied rule, such as a
// dietitian's social media accounts.
export function openCheckedExternalLink(target, isAllowed) {
  return openCheckedTarget(target, isAllowed, linkingDependencies);
}

export function openSupportEmail() {
  return openExternalLink(SUPPORT_MAILTO_URL);
}
