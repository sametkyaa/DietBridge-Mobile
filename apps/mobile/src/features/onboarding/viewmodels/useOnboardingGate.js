import { useEffect, useState } from 'react';
import { getClientProfile } from '../../clients/services/clientService';
import { isProfileSetUp, readOnboardingState, updateOnboardingState } from '../services/onboardingStateStore';

// Decides once per login whether the app opens on the setup flow or the main tabs.
// Any failure falls back to the main tabs so onboarding never blocks the app.
export function useOnboardingGate(userId) {
    const [state, setState] = useState({ status: 'loading', showSetup: false });

    useEffect(() => {
        let active = true;
        const resolve = async () => {
            if (!userId) {
                if (active) setState({ status: 'ready', showSetup: false });
                return;
            }
            try {
                const stored = await readOnboardingState(userId);
                if (stored.setupCompleted) {
                    if (active) setState({ status: 'ready', showSetup: false });
                    return;
                }
                const profile = await getClientProfile();
                if (isProfileSetUp(profile)) {
                    // Existing clients with a filled profile skip the flow for good.
                    await updateOnboardingState(userId, { setupCompleted: true }).catch(() => {});
                    if (active) setState({ status: 'ready', showSetup: false });
                    return;
                }
                if (active) setState({ status: 'ready', showSetup: true });
            } catch (error) {
                console.warn('Onboarding gate check failed:', error?.message || error);
                if (active) setState({ status: 'ready', showSetup: false });
            }
        };
        setState({ status: 'loading', showSetup: false });
        void resolve();
        return () => { active = false; };
    }, [userId]);

    return state;
}
