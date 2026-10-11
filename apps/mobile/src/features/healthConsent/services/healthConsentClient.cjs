'use strict';

const CONSENT_REQUIRED_MESSAGE = 'Sağlık bilgilerini kaydetmek için sağlık verisi tercihini onayla. Hesabını bu bilgileri paylaşmadan da kullanabilirsin.';
const SHARING_REQUIRED_MESSAGE = 'Bu bilgiyi diyetisyenine göndermek için sağlık verisi paylaşım tercihini onayla.';
const CONSENT_UNAVAILABLE_MESSAGE = 'Sağlık verisi tercihleri doğrulanamadı. Lütfen tekrar deneyin.';

function validateConsentState(value) {
  if (!value || typeof value.enabled !== 'boolean'
      || typeof value.document_version !== 'string' || !value.document_version
      || typeof value.notice_version !== 'string' || !value.notice_version
      || typeof value.processing_text !== 'string' || !value.processing_text
      || typeof value.sharing_text !== 'string' || !value.sharing_text
      || typeof value.storage_granted !== 'boolean' || typeof value.sharing_granted !== 'boolean'
      || (value.sharing_granted && !value.storage_granted)
      || (value.updated_at !== null && (typeof value.updated_at !== 'string' || !Number.isFinite(Date.parse(value.updated_at))))
      || (value.storage_granted && value.updated_at === null)) {
    throw new Error(CONSENT_UNAVAILABLE_MESSAGE);
  }
  return value;
}

function createHealthConsentClient(supabase, enabled) {
  const get = async () => {
    if (!enabled) return { enabled: false };
    const { data, error } = await supabase.rpc('get_my_health_consent');
    if (error) { const failure = new Error(CONSENT_UNAVAILABLE_MESSAGE); failure.code = 'HEALTH_CONSENT_UNAVAILABLE'; throw failure; }
    return validateConsentState(data);
  };
  const set = async ({ documentVersion, storage, sharing }) => {
    if (!enabled || typeof storage !== 'boolean' || typeof sharing !== 'boolean' || (sharing && !storage)) {
      throw new Error(CONSENT_UNAVAILABLE_MESSAGE);
    }
    const { data, error } = await supabase.rpc('set_my_health_consent', {
      p_document_version: documentVersion, p_storage: storage, p_sharing: sharing,
    });
    if (error) { const failure = new Error(CONSENT_UNAVAILABLE_MESSAGE); failure.code = 'HEALTH_CONSENT_UNAVAILABLE'; throw failure; }
    const result = validateConsentState(data);
    if (!result.enabled || result.storage_granted !== storage || result.sharing_granted !== sharing) {
      throw new Error(CONSENT_UNAVAILABLE_MESSAGE);
    }
    return result;
  };
  const requireStorage = async () => {
    const state = await get();
    if (state.enabled && !state.storage_granted) {
      const failure = new Error(CONSENT_REQUIRED_MESSAGE);
      failure.code = 'HEALTH_CONSENT_REQUIRED';
      throw failure;
    }
  };
  const requireSharing = async () => {
    const state = await get();
    if (state.enabled && (!state.storage_granted || !state.sharing_granted)) {
      const failure = new Error(SHARING_REQUIRED_MESSAGE);
      failure.code = 'HEALTH_CONSENT_REQUIRED';
      throw failure;
    }
  };
  return { get, set, requireStorage, requireSharing };
}

module.exports = { createHealthConsentClient, validateConsentState, CONSENT_REQUIRED_MESSAGE, CONSENT_UNAVAILABLE_MESSAGE };
