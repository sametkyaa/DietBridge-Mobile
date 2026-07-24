import { supabase } from '../../../lib/supabaseClient';
import { buildMealPlanChannelConfig } from './mealPlanRealtimePolicy';

export {
    createRealtimeRefreshScheduler,
    isMealEventRelevant,
    isMealPlanEventRelevant,
} from './mealPlanRealtimePolicy';

// Realtime auth is handled by the shared client: supabase-js pushes the current
// session token into the realtime connection on sign-in and token refresh, so
// no parallel client or manual token wiring is needed here.
export const getMealPlanRealtimeClientId = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user?.id) {
        if (__DEV__ && error) {
            console.warn('Meal plan realtime auth check failed.');
        }
        return null;
    }

    return data.user.id;
};

// Subscribes to the authenticated client's meal plan changes and reports raw
// invalidation signals. Payloads are never written to UI state; ownership and
// date relevance are decided by the caller through the policy helpers.
export const subscribeMealPlanChanges = ({ clientId, onChange, onStatus } = {}) => {
    if (!clientId || typeof onChange !== 'function') {
        return () => {};
    }

    const { channelName, subscriptions } = buildMealPlanChannelConfig(clientId);
    const channel = supabase.channel(channelName);

    subscriptions.forEach(({ table, event, filter }) => {
        const config = { event, schema: 'public', table };
        if (filter) config.filter = filter;
        channel.on('postgres_changes', config, (payload) => onChange({ table, event, payload }));
    });

    channel.subscribe((status) => {
        // Status is observational only: realtime-js owns reconnects, so
        // CHANNEL_ERROR/TIMED_OUT/CLOSED must not spawn replacement channels.
        if (__DEV__ && status !== 'SUBSCRIBED') {
            console.warn('Meal plan realtime channel status changed.', { status });
        }
        if (typeof onStatus === 'function') onStatus(status);
    });

    return () => {
        try {
            supabase.removeChannel(channel);
        } catch (error) {
            if (__DEV__) {
                console.warn('Meal plan realtime channel cleanup failed.');
            }
        }
    };
};
