import { useRef, useState } from 'react';
import { acceptLegalDocuments, getCurrentClientAuthState, signOut } from '../services/authService';
import { hasLegalAcceptance } from '../utils/legalAcceptancePolicy.cjs';

export const useLegalAcceptanceViewModel = (onAccepted, { legalAcceptanceRequired = true, healthConsentNeedsReview = false } = {}) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kvkkAcknowledged, setKvkkAcknowledged] = useState(false);
  const [legalAcceptanceSaved, setLegalAcceptanceSaved] = useState(!legalAcceptanceRequired);
  const [needsHealthConsentReview, setNeedsHealthConsentReview] = useState(healthConsentNeedsReview);
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
        setError('Sağlık verisi tercihlerin henüz kaydedilmedi. Seçimlerini kontrol edip Tercihleri kaydet’e dokun, ardından tekrar devam et. Rıza vermeden devam etmek için kutuları boş bırakarak kaydedebilirsin.');
        return;
      }
      onAccepted(next);
    } catch {
      setError('Bilgiler kaydedilemedi. Lütfen tekrar deneyin.');
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
    loading, error, submit, logout,
  };
};
