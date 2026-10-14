import { useRef, useState } from 'react';
import { acceptLegalDocuments, getCurrentClientAuthState, signOut } from '../services/authService';
import { hasLegalAcceptance } from '../utils/legalAcceptancePolicy.cjs';
import { getHealthConsent, HEALTH_CONSENT_UI_ENABLED } from '../../healthConsent/services/healthConsentService';
import { assertRegistrationHealthConsent, createUserError, formatUserError } from '../../../shared/utils/userError.cjs';

export const useLegalAcceptanceViewModel = (onAccepted, { legalAcceptanceRequired = true, healthConsentNeedsReview = false } = {}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kvkkAcknowledged, setKvkkAcknowledged] = useState(false);
  const [legalAcceptanceSaved, setLegalAcceptanceSaved] = useState(!legalAcceptanceRequired);
  const [needsHealthConsentReview, setNeedsHealthConsentReview] = useState(healthConsentNeedsReview);
  const [healthConsentReady, setHealthConsentReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lock = useRef(false);

  const submit = async () => {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError(null);
    try {
      if (!legalAcceptanceSaved) {
        await acceptLegalDocuments({ termsAccepted, kvkkAcknowledged });
        setLegalAcceptanceSaved(true);
      }
      const next = await getCurrentClientAuthState();
      if (!next.isClient || !hasLegalAcceptance(next.profile)) throw new Error('Acceptance could not be confirmed.');
      if (next.healthConsentNeedsReview) {
        setNeedsHealthConsentReview(true);
        setError(formatUserError(createUserError('HEALTH_CONFIRMATION_REQUIRED')));
        return;
      }
      if (HEALTH_CONSENT_UI_ENABLED && needsHealthConsentReview) {
        const receipt = await getHealthConsent();
        if (!receipt.enabled || !receipt.updated_at) throw createUserError('HEALTH_CONFIRMATION_FAILED');
        assertRegistrationHealthConsent({ storage: receipt.storage_granted, sharing: receipt.sharing_granted }, true);
      }
      onAccepted(next);
    } catch (failure) {
      setError(formatUserError(failure, 'HEALTH_CONFIRMATION_FAILED'));
    } finally {
      lock.current = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await signOut();
      if (result?.ok === false) throw new Error('Sign out failed.');
    } catch {
      setError('Çıkış yapılamadı. Lütfen tekrar deneyin.');
    } finally {
      lock.current = false;
      setLoading(false);
    }
  };

  return {
    termsAccepted, setTermsAccepted, kvkkAcknowledged, setKvkkAcknowledged,
    legalAcceptanceRequired: !legalAcceptanceSaved,
    healthConsentNeedsReview: needsHealthConsentReview,
    healthConsentReady, setHealthConsentReady,
    loading, error, submit, logout,
  };
};
