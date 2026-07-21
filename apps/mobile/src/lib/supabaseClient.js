import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or anon key is not set in the environment variables.');
}

const createSupabaseClient = () => createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
    },
});

const developmentClient = __DEV__ ? globalThis.__dietBridgeSupabaseClient : null;

export const supabase = developmentClient || createSupabaseClient();

if (__DEV__) {
    globalThis.__dietBridgeSupabaseClient = supabase;
}

let currentState = AppState.currentState;
let autoRefreshOperation = Promise.resolve();

const setAutoRefreshForState = (nextAppState) => {
    autoRefreshOperation = autoRefreshOperation
        .then(() => (
            nextAppState === 'active'
                ? supabase.auth.startAutoRefresh()
                : supabase.auth.stopAutoRefresh()
        ))
        .catch(() => undefined);
};

const handleAppStateChange = (nextAppState) => {
    if (currentState?.match(/inactive|background/) && nextAppState === 'active') {
        setAutoRefreshForState(nextAppState);
    } else if (nextAppState.match(/inactive|background/)) {
        setAutoRefreshForState(nextAppState);
    }
    currentState = nextAppState;
};

setAutoRefreshForState(currentState);

if (__DEV__) {
    globalThis.__dietBridgeAuthAppStateSubscription?.remove();
}

const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

if (__DEV__) {
    globalThis.__dietBridgeAuthAppStateSubscription = appStateSubscription;
}

export default supabase;
