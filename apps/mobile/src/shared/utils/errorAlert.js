import { Alert as NativeAlert, Keyboard } from 'react-native';
import { errorPresenter } from './errorPresenter.cjs';
import { ERROR_CATALOG, getUserError } from './userError.cjs';

const knownErrors = new Set(ERROR_CATALOG.map((entry) => entry.message));
const titleFallbacks = {
  'Bildirim izni kapalı': 'PUSH_PERMISSION_DENIED', 'Bildirim izni verilmedi': 'PUSH_PERMISSION_REQUIRED',
  'Ayarlar açılamadı': 'PUSH_SETTINGS_UNAVAILABLE', 'Bildirimler açılamadı': 'PUSH_ENABLE_FAILED',
  'Bildirim açılamadı': 'NOTIFICATION_OPEN_FAILED', 'Fotoğraf eklenemedi': 'PHOTO_SELECTION_FAILED',
  'Mesaj silinemedi': 'CHAT_DELETE_FAILED', 'Randevu görüntülenemiyor': 'APPOINTMENT_OPEN_FAILED',
  'Bağlantı açılamadı': 'LINK_OPEN_FAILED',
};

// Keep native buttons and options unchanged; only error explanations are translated.
export const Alert = {
  alert(title, message, buttons, options) {
    const isError = title === 'Hata' || title === 'Uyarı' || titleFallbacks[title] || knownErrors.has(message);
    if (isError) {
      Keyboard.dismiss();
      return errorPresenter.show(title, getUserError(message, titleFallbacks[title]), buttons, options);
    }
    return NativeAlert.alert(title, message, buttons, options);
  },
};
