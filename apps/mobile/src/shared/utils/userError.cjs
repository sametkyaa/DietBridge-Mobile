'use strict';

const { ERROR_MESSAGES } = require('./errorMessages.cjs');
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_RULES_MESSAGE = `Şifren en az ${PASSWORD_MIN_LENGTH} karakter olmalı. Daha güçlü bir şifre için büyük ve küçük harf, rakam ve özel karakter kullanmanı öneririz.`;
const DEFINITIONS = Object.freeze({
  GENERAL_FAILED: 'İşlem tamamlanamadı. Lütfen tekrar dene.',
  LOAD_FAILED: 'Bilgiler yüklenemedi. Bağlantını kontrol edip tekrar dene.',
  NETWORK_UNAVAILABLE: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.',
  REQUEST_TIMEOUT: 'İşlem beklenenden uzun sürdü. Bağlantını kontrol edip tekrar dene.',
  SERVICE_UNAVAILABLE: 'Hizmet şu anda yanıt veremiyor. Biraz sonra tekrar dene.',
  RATE_LIMITED: 'Kısa sürede çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',
  AUTH_EMAIL_REQUIRED: 'E-posta adresini gir.',
  AUTH_EMAIL_INVALID: 'Geçerli bir e-posta adresi gir. Örnek: ad@ornek.com',
  AUTH_PASSWORD_REQUIRED: 'Şifreni gir.',
  AUTH_PASSWORD_SHORT: `Şifren en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`,
  AUTH_PASSWORD_CONFIRM_REQUIRED: 'Şifreni doğrulama alanına tekrar gir.',
  AUTH_PASSWORD_MISMATCH: 'Şifreler eşleşmiyor. Her iki alana aynı şifreyi gir.',
  AUTH_PASSWORD_WEAK: 'Şifre güvenlik koşullarını karşılamıyor. Daha uzun, büyük ve küçük harf, rakam ve özel karakter içeren bir şifre dene.',
  AUTH_PASSWORD_CHARACTERS: 'Şifrende gereken karakter türleri eksik. Büyük ve küçük harf, rakam ve özel karakter kullan.',
  AUTH_PASSWORD_LEAKED: 'Bu şifre bilinen veri sızıntılarında yer alıyor. Başka ve benzersiz bir şifre seç.',
  AUTH_PASSWORD_SAME: 'Yeni şifren mevcut şifrenden farklı olmalı.',
  AUTH_CURRENT_PASSWORD_INVALID: 'Mevcut şifren hatalı. Kontrol edip tekrar gir.',
  AUTH_NAME_REQUIRED: 'Adını ve soyadını gir.',
  AUTH_INVALID_CREDENTIALS: 'E-posta veya şifre hatalı. Bilgilerini kontrol edip tekrar dene.',
  AUTH_EMAIL_UNCONFIRMED: 'E-posta adresin henüz doğrulanmadı. Gelen kutundaki doğrulama bağlantısına dokunup ardından tekrar giriş yap. Spam klasörünü de kontrol et.',
  AUTH_EMAIL_EXISTS: 'Bu e-posta adresiyle zaten hesap var. Giriş yapabilir veya şifreni sıfırlayabilirsin.',
  AUTH_SESSION_EXPIRED: 'Oturumun sona erdi. Tekrar giriş yap.',
  AUTH_RECOVERY_INVALID: 'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı iste.',
  AUTH_DISABLED: 'Bu giriş veya kayıt yöntemi şu anda kullanılamıyor. Biraz sonra tekrar dene.',
  AUTH_SIGNUP_FAILED: 'Hesap oluşturulamadı. Bağlantını kontrol edip tekrar dene.',
  AUTH_LOGIN_FAILED: 'Giriş tamamlanamadı. Bağlantını kontrol edip tekrar dene.',
  AUTH_RESET_FAILED: 'Şifre sıfırlama e-postası gönderilemedi. Biraz sonra tekrar dene.',
  AUTH_PASSWORD_UPDATE_FAILED: 'Şifre güncellenemedi. Oturumunu kontrol edip tekrar dene.',
  LEGAL_ACCEPTANCE_REQUIRED: 'Devam etmek için Kullanım Koşulları’nı kabul et ve KVKK Aydınlatma Metni’ni okuduğunu belirt.',
  HEALTH_STORAGE_REQUIRED: 'Devam etmek için sağlık verilerinin işlenmesi ve saklanması onayını ver.',
  HEALTH_SHARING_REQUIRED: 'Devam etmek için sağlık verilerinin bağlı diyetisyeninle paylaşılması onayını ver.',
  HEALTH_CONFIRMATION_REQUIRED: 'Devam etmek için iki sağlık onayını da verip Tercihleri kaydet’e dokun.',
  HEALTH_CONFIRMATION_FAILED: 'Sağlık onayları doğrulanamadı. Tercihlerini kaydedip tekrar dene.',
  PROFILE_VALUE_INVALID: 'Bu alan için geçerli bir değer gir.',
  PROFILE_VALUE_REQUIRED: 'Bu alan boş bırakılamaz.',
  PROFILE_VALUE_RANGE: 'Bu alan için belirtilen sınırlar içinde bir değer gir.',
  PROFILE_DATE_INVALID: 'Geçerli bir tarih gir.',
  MEASUREMENT_INVALID: 'Geçerli bir vücut ölçüsü gir.',
  MEASUREMENT_REFRESH_FAILED: 'Ölçüler kaydedildi ancak analiz verileri yenilenemedi. Lütfen tekrar deneyin.',
  WEIGHT_REFRESH_FAILED: 'Kilo kaydedildi ancak analiz verileri yenilenemedi. Lütfen tekrar deneyin.',
  PUSH_PERMISSION_DENIED: 'DietBridge bildirimlerini telefonunun uygulama ayarlarından açabilirsin.',
  PUSH_PERMISSION_REQUIRED: 'Bildirimleri açmak için tekrar dokunup izin penceresinden onay verebilirsin.',
  PUSH_SETTINGS_UNAVAILABLE: 'Telefonunun Ayarlar bölümünden DietBridge uygulamasını seçip bildirimlere izin verebilirsin.',
  PUSH_ENABLE_FAILED: 'Bildirimler şu anda etkinleştirilemedi. Lütfen daha sonra tekrar dene.',
  NOTIFICATION_OPEN_FAILED: 'Bildirim açılamadı. Bildirimler ekranından tekrar deneyebilirsiniz.',
  PHOTO_SELECTION_FAILED: 'Fotoğraf eklenemedi. Fotoğraf iznini kontrol edip tekrar dene.',
  CHAT_DELETE_FAILED: 'Mesaj şu anda silinemedi. Lütfen tekrar deneyin.',
  APPOINTMENT_OPEN_FAILED: 'Bu randevu artık görüntülenemiyor.',
  LINK_OPEN_FAILED: 'Bu bağlantı cihazınızda açılamadı. Lütfen daha sonra tekrar deneyin.',
});
const catalog = new Map(ERROR_MESSAGES.map((entry) => [entry.code, entry]));
for (const [name, message] of Object.entries(DEFINITIONS)) catalog.set(name, Object.freeze({ code: `DB-${name.replaceAll('_', '-')}`, message }));
const byMessage = new Map(ERROR_MESSAGES.map((entry) => [entry.message, entry]));
for (const entry of catalog.values()) if (!byMessage.has(entry.message)) byMessage.set(entry.message, entry);
const byDisplayCode = new Map([...catalog.values()].map((entry) => [entry.code, entry]));
const AUTH_CODES = Object.freeze({
  invalid_credentials: 'AUTH_INVALID_CREDENTIALS', email_address_invalid: 'AUTH_EMAIL_INVALID',
  email_not_confirmed: 'AUTH_EMAIL_UNCONFIRMED', email_exists: 'AUTH_EMAIL_EXISTS', user_already_exists: 'AUTH_EMAIL_EXISTS',
  weak_password: 'AUTH_PASSWORD_WEAK', PASSWORD_WEAK: 'AUTH_PASSWORD_WEAK', same_password: 'AUTH_PASSWORD_SAME', PASSWORD_SAME: 'AUTH_PASSWORD_SAME',
  PASSWORD_CURRENT_INVALID: 'AUTH_CURRENT_PASSWORD_INVALID',
  session_not_found: 'AUTH_SESSION_EXPIRED', session_expired: 'AUTH_SESSION_EXPIRED', refresh_token_not_found: 'AUTH_SESSION_EXPIRED', refresh_token_already_used: 'AUTH_SESSION_EXPIRED',
  otp_expired: 'AUTH_RECOVERY_INVALID', bad_code_verifier: 'AUTH_RECOVERY_INVALID', flow_state_expired: 'AUTH_RECOVERY_INVALID',
  over_request_rate_limit: 'RATE_LIMITED', over_email_send_rate_limit: 'RATE_LIMITED', over_sms_send_rate_limit: 'RATE_LIMITED',
  signup_disabled: 'AUTH_DISABLED', email_provider_disabled: 'AUTH_DISABLED', email_address_not_authorized: 'AUTH_DISABLED',
  DAILY_LOG_NETWORK_ERROR: 'NETWORK_UNAVAILABLE', TIMED_OUT: 'REQUEST_TIMEOUT', CHANNEL_ERROR: 'NETWORK_UNAVAILABLE', CHAT_RATE_LIMIT: 'RATE_LIMITED',
});
// Only app-owned labels and bounded numeric ranges may be included in dynamic validation messages.
const PROFILE_LABELS = new Set(['Ad soyad', 'Doğum tarihi', 'Son tahlil tarihi', 'Boy', 'Kilo', 'Güncel kilo', 'Hedef kilo', 'Günlük su hedefi', 'Su hedefi', 'Uyku süresi', 'Minimum uyku', 'Maksimum uyku', 'Sigara kullanımı', 'Alkol kullanımı']);
function getDynamicError(message, code) {
  if (typeof message !== 'string') return null;
  const password = message.match(/^Şifren en az (\d+) karakter olmalı\.$/);
  if (password && (!code || code === 'DB-AUTH-PASSWORD-SHORT') && Number(password[1]) >= PASSWORD_MIN_LENGTH && Number(password[1]) <= 128) {
    return { code: catalog.get('AUTH_PASSWORD_SHORT').code, message };
  }
  const field = message.match(/^(.+?) (boş bırakılamaz\.|sayısal olmalıdır\.|en (az|fazla) (\d+(?:\.\d+)?) olmalıdır\.|için geçerli bir seçenek seçiniz\.|YYYY-AA-GG biçiminde olmalıdır\.|geçerli bir tarih olmalıdır\.|gelecekte olamaz\.)$/);
  if (field && PROFILE_LABELS.has(field[1]) && (!field[4] || Number(field[4]) <= 10000)) {
    const name = field[3] ? 'PROFILE_VALUE_RANGE' : /tarih|YYYY|gelecekte/.test(field[2]) ? 'PROFILE_DATE_INVALID' : field[2].startsWith('boş') ? 'PROFILE_VALUE_REQUIRED' : 'PROFILE_VALUE_INVALID';
    const entry = { code: catalog.get(name).code, message };
    return !code || code === entry.code ? entry : null;
  }
  const range = message.match(/^Lütfen (\d+(?:\.\d+)?) ile (\d+(?:\.\d+)?) (cm|kg|L|lt|ml|saat) arasında geçerli bir değer girin\.$/);
  if (range && Number(range[1]) <= Number(range[2]) && Number(range[2]) <= 10000 && (!code || code === catalog.get('PROFILE_VALUE_RANGE').code)) {
    return { code: catalog.get('PROFILE_VALUE_RANGE').code, message };
  }
  if (/^Geçersiz ölçüm değeri: (waist|hip|right_arm|left_arm|chest|right_calf|left_calf|neck)$/.test(message)) return catalog.get('MEASUREMENT_INVALID');
  return null;
}
function getUserError(error, fallback = 'GENERAL_FAILED') {
  const code = error && typeof error === 'object' ? error.code : null;
  let name = catalog.has(code) ? code : AUTH_CODES[code];
  const message = typeof error === 'string' ? error : error?.userMessage ?? error?.message;
  if (name === 'AUTH_PASSWORD_WEAK') {
    const reasons = Array.isArray(error?.reasons) ? error.reasons : [];
    if (reasons.includes('pwned')) name = 'AUTH_PASSWORD_LEAKED';
    else if (reasons.includes('characters')) name = 'AUTH_PASSWORD_CHARACTERS';
    else if (reasons.includes('length') || /at least \d+ characters/i.test(message ?? '')) {
      const minimum = Number(message?.match(/at least (\d+) characters/i)?.[1]);
      if (Number.isInteger(minimum) && minimum >= PASSWORD_MIN_LENGTH && minimum <= 128) {
        return { code: catalog.get('AUTH_PASSWORD_SHORT').code, message: `Şifren en az ${minimum} karakter olmalı.` };
      }
      name = 'AUTH_PASSWORD_SHORT';
    }
  }
  if (name) return catalog.get(name);
  if (byDisplayCode.has(code)) return getDynamicError(message, code) ?? byDisplayCode.get(code);
  if (typeof message === 'string') {
    const formatted = message.match(/^([\s\S]+)\nHata kodu: (DB-[A-Z0-9-]+)$/);
    if (formatted && byDisplayCode.has(formatted[2])) {
      const entry = byDisplayCode.get(formatted[2]);
      if (entry.message === formatted[1]) return entry;
      const dynamic = getDynamicError(formatted[1], formatted[2]);
      if (dynamic) return dynamic;
    }
    if (/email not confirmed/i.test(message)) return catalog.get('AUTH_EMAIL_UNCONFIRMED');
    if (/network request failed|failed to fetch|fetch failed|network failure/i.test(message)) return catalog.get('NETWORK_UNAVAILABLE');
    if (/timeout|timed out/i.test(message) || error?.name === 'AbortError') return catalog.get('REQUEST_TIMEOUT');
  }
  if (error?.name === 'AuthRetryableFetchError') return catalog.get('NETWORK_UNAVAILABLE');
  if (error?.status === 429) return catalog.get('RATE_LIMITED');
  if (Number(error?.status) >= 500) return catalog.get('SERVICE_UNAVAILABLE');
  if (byMessage.has(message)) return byMessage.get(message);
  const dynamic = getDynamicError(message);
  if (dynamic) return dynamic;
  return catalog.get(fallback) ?? catalog.get('GENERAL_FAILED');
}
const formatUserError = (error, fallback) => {
  // Codes stay available to internal error handling, never to user-facing copy.
  return getUserError(error, fallback).message;
};
function createUserError(name) {
  const entry = catalog.get(name) ?? catalog.get('GENERAL_FAILED');
  const error = new Error(entry.message);
  error.code = name;
  error.userMessage = entry.message;
  return error;
}
function assertNewPassword(password) {
  if (typeof password !== 'string' || !password.trim()) throw createUserError('AUTH_PASSWORD_REQUIRED');
  if (password.length < PASSWORD_MIN_LENGTH) throw createUserError('AUTH_PASSWORD_SHORT');
}
function assertEmail(email) {
  if (typeof email !== 'string' || !email.trim()) throw createUserError('AUTH_EMAIL_REQUIRED');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw createUserError('AUTH_EMAIL_INVALID');
}
function assertRegistrationHealthConsent(choice, enabled) {
  if (!enabled) return;
  if (choice?.storage !== true) throw createUserError('HEALTH_STORAGE_REQUIRED');
  if (choice?.sharing !== true) throw createUserError('HEALTH_SHARING_REQUIRED');
}
module.exports = { PASSWORD_MIN_LENGTH, PASSWORD_RULES_MESSAGE, ERROR_CATALOG: Object.freeze([...byDisplayCode.values()]), getUserError, formatUserError, createUserError, assertNewPassword, assertEmail, assertRegistrationHealthConsent };
