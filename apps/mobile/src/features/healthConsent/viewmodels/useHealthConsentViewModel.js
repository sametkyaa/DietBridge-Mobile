import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getHealthConsent, setHealthConsent, HEALTH_CONSENT_UI_ENABLED } from '../services/healthConsentService';

export function useHealthConsentViewModel() {
  const [state, setState] = useState(null);
  const [storage, setStorage] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(HEALTH_CONSENT_UI_ENABLED);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const generation = useRef(0);
  const lock = useRef(false);

  const apply = (result) => {
    setState(result);
    setStorage(result.storage_granted === true);
    setSharing(result.sharing_granted === true);
  };
  const load = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await getHealthConsent();
      if (generation.current === request) apply(result);
    } catch (failure) {
      if (generation.current === request) { setState(null); setError(failure.message); }
    } finally {
      if (generation.current === request) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    if (HEALTH_CONSENT_UI_ENABLED) void load();
    return () => { generation.current += 1; };
  }, [load]));

  const save = async () => {
    if (lock.current || loading || !state?.enabled) return;
    lock.current = true;
    const request = ++generation.current;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await setHealthConsent({ documentVersion: state.document_version,
        storage, sharing });
      if (generation.current === request) {
        apply(result);
        setSuccess('Tercihlerin kaydedildi.');
      }
    } catch (failure) {
      if (generation.current === request) setError(failure.message);
    } finally {
      lock.current = false;
      setSaving(false);
    }
  };
  return { visible: HEALTH_CONSENT_UI_ENABLED, state, storage, sharing, loading, saving, error, success,
    retry: load, save,
    chooseStorage: (value) => { setStorage(value); if (!value) setSharing(false); setSuccess(null); },
    chooseSharing: (value) => { setSharing(value); setSuccess(null); } };
}
