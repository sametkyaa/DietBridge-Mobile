const LEGAL_ACCEPTANCE_MESSAGE = 'Devam etmek için Kullanım Koşulları’nı kabul edin ve KVKK Aydınlatma Metni’ni okuduğunuzu belirtin.';

const assertLegalAcceptance = (acceptance) => {
  if (acceptance?.termsAccepted !== true || acceptance?.kvkkAcknowledged !== true) {
    throw new Error(LEGAL_ACCEPTANCE_MESSAGE);
  }
};

const hasLegalAcceptance = (profile) => Boolean(
  profile?.terms_accepted_at && profile?.kvkk_accepted_at,
);

module.exports = { LEGAL_ACCEPTANCE_MESSAGE, assertLegalAcceptance, hasLegalAcceptance };
