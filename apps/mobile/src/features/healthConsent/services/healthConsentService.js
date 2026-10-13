import { supabase } from '../../../lib/supabaseClient';
import { createHealthConsentClient } from './healthConsentClient.cjs';
import { clearChatImageUriCache } from '../../chat/services/chatImageResolver';
import { createRegistrationHealthConsent } from './registrationHealthConsent.cjs';

// Rollout switch only; the database independently enforces consent once enabled.
export const HEALTH_CONSENT_UI_ENABLED = process.env.EXPO_PUBLIC_ENABLE_HEALTH_CONSENT === 'true';
const client = createHealthConsentClient(supabase, HEALTH_CONSENT_UI_ENABLED);
export const getHealthConsent = client.get;
export const setHealthConsent = async (choice) => {
    try { return await client.set(choice); }
    finally { clearChatImageUriCache('consent'); }
};
export const requireHealthStorageConsent = client.requireStorage;

export const requireHealthSharingConsent = client.requireSharing;

export const reconcileRegistrationHealthConsent = createRegistrationHealthConsent({
    enabled: HEALTH_CONSENT_UI_ENABLED,
    getConsent: getHealthConsent,
    setConsent: setHealthConsent,
    getSessionUserId: async () => {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session?.user?.id;
    },
}).reconcile;
