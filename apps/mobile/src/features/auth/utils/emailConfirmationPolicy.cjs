'use strict';

const MOBILE_EMAIL_CONFIRMATION_URL = 'https://app.dietbridge.com.tr/mobil/eposta-dogrulama';
const EMAIL_NOT_CONFIRMED_MESSAGE = 'E-posta adresin henüz doğrulanmadı. Gelen kutundaki doğrulama bağlantısına dokunup ardından tekrar giriş yap. E-postayı bulamazsan spam veya gereksiz klasörünü kontrol et.';

const isEmailNotConfirmedError = (error) => error?.code === 'email_not_confirmed'
  || (typeof error?.message === 'string' && /email not confirmed/i.test(error.message));

module.exports = { MOBILE_EMAIL_CONFIRMATION_URL, EMAIL_NOT_CONFIRMED_MESSAGE, isEmailNotConfirmedError };
