import { supabase } from '../../../lib/supabaseClient';
import { createHealthConsentClient } from './healthConsentClient.cjs';

// Rollout switch only; the database independently enforces consent once enabled.
export const HEALTH_CONSENT_UI_ENABLED = process.env.EXPO_PUBLIC_ENABLE_HEALTH_CONSENT === 'true';
const client = createHealthConsentClient(supabase, HEALTH_CONSENT_UI_ENABLED);
export const getHealthConsent = client.get;
export const setHealthConsent = client.set;
export const requireHealthStorageConsent = client.requireStorage;
