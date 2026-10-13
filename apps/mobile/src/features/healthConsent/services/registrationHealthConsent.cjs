'use strict';

// Pinned to the existing backend document. A changed server document requires a new choice.
const REGISTRATION_HEALTH_DOCUMENT = Object.freeze({
  documentVersion: 'health-core-2026-10-11-v1-draft',
  noticeVersion: 'health-core-notice-2026-10-11-v1-draft',
  processingText: 'Sağlık, ölçüm, beslenme ve yaşam tarzı bilgilerimin kişisel takip kayıtlarımın oluşturulması ve hesabımda saklanması amacıyla DietBridge tarafından işlenmesine açık rıza veriyorum.',
  sharingText: 'Bu bilgilerimin yalnız aktif bağlantı kurduğum yetkili diyetisyene beslenme planı ve takip hizmeti amacıyla sunulmasına açık rıza veriyorum.',
});

const createRegistrationHealthChoice = ({ storage, sharing }) => {
  if (typeof storage !== 'boolean' || typeof sharing !== 'boolean' || (sharing && !storage)) {
    throw new Error('Sağlık verisi tercihlerini kontrol edin.');
  }
  return { ...REGISTRATION_HEALTH_DOCUMENT, storage, sharing };
};

// Metadata carries the user's initial choices, never an authorization grant.
// Only the authenticated consent RPC can establish a server receipt.
const createRegistrationHealthConsent = ({ enabled, getConsent, setConsent, getSessionUserId }) => {
  const inFlight = new Map();
  const reconcile = async (user) => {
    const choice = user?.user_metadata?.registration_health_consent;
    if (!enabled || !user?.id || !choice) return { needsReview: false };
    if (inFlight.has(user.id)) return inFlight.get(user.id);
    const request = (async () => {
      try {
        if (await getSessionUserId() !== user.id) return { needsReview: true };
        const state = await getConsent();
        // Never replay registration choices over a later grant or withdrawal.
        if (!state.enabled || state.updated_at !== null) return { needsReview: false };
        if (typeof choice.storage !== 'boolean' || typeof choice.sharing !== 'boolean'
            || (choice.sharing && !choice.storage)
            || choice.documentVersion !== state.document_version
            || choice.noticeVersion !== state.notice_version
            || choice.processingText !== state.processing_text
            || choice.sharingText !== state.sharing_text) return { needsReview: true };
        if (await getSessionUserId() !== user.id) return { needsReview: true };
        const receipt = await setConsent({ documentVersion: choice.documentVersion, storage: choice.storage, sharing: choice.sharing });
        if (!receipt?.enabled || typeof receipt.updated_at !== 'string' || !Number.isFinite(Date.parse(receipt.updated_at))
            || receipt.storage_granted !== choice.storage || receipt.sharing_granted !== choice.sharing) {
          return { needsReview: true };
        }
        return { needsReview: false };
      } catch {
        return { needsReview: true };
      }
    })();
    inFlight.set(user.id, request);
    try { return await request; }
    finally { inFlight.delete(user.id); }
  };
  return { reconcile };
};

module.exports = { REGISTRATION_HEALTH_DOCUMENT, createRegistrationHealthChoice, createRegistrationHealthConsent };
