import { useRef, useState } from 'react';
import { acceptLegalDocuments, getCurrentClientAuthState, signOut } from '../services/authService';
import { hasLegalAcceptance } from '../utils/legalAcceptancePolicy.cjs';

export const useLegalAcceptanceViewModel = (onAccepted) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kvkkAcknowledged, setKvkkAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lock = useRef(false);

  const submit = async () => {
    if (lock.current) return;
    lock.current = true;
    setLoading(true);
    setError(null);
    try {
      await acceptLegalDocuments({ termsAccepted, kvkkAcknowledged });
      const next = await getCurrentClientAuthState();
      if (!next.isClient || !hasLegalAcceptance(next.profile)) throw new Error('Acceptance could not be confirmed.');
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
    loading, error, submit, logout,
  };
};
