import { Alert, Linking } from 'react-native';
import {
  SUPPORT_MAILTO_URL,
  openExternalTarget,
} from './externalLinkPolicy.cjs';

const LINK_FAILURE_TITLE = 'Bağlantı açılamadı';
const LINK_FAILURE_MESSAGE = 'Bu bağlantı cihazınızda açılamadı. Lütfen daha sonra tekrar deneyin.';

export function openExternalLink(target) {
  return openExternalTarget(target, {
    canOpenURL: (value) => Linking.canOpenURL(value),
    openURL: (value) => Linking.openURL(value),
    onFailure: () => Alert.alert(LINK_FAILURE_TITLE, LINK_FAILURE_MESSAGE),
  });
}

export function openSupportEmail() {
  return openExternalLink(SUPPORT_MAILTO_URL);
}
