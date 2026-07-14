import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or anon key is not set in the environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

let currentState = AppState.currentState;

const handleAppStateChange = (nextAppState) => {
    if (currentState.match(/inactive|background/) && nextAppState === 'active') {
        supabase.auth.startAutoRefresh();
    } else if (nextAppState.match(/inactive|background/)) {
        supabase.auth.stopAutoRefresh();
    }
    currentState = nextAppState;
};

supabase.auth.startAutoRefresh();
AppState.addEventListener('change', handleAppStateChange);

export default supabase;
