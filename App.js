import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import RootNavigator from './apps/mobile/src/navigation/RootNavigator';
import AuthNavigator from './apps/mobile/src/navigation/AuthNavigator';
import { MealsProvider } from './apps/mobile/src/features/meals/context/MealsContext'; // Updated path
import { DietitianConnectionProvider } from './apps/mobile/src/features/dietitianConnection/context/DietitianConnectionContext';
import './apps/mobile/src/shared/theme/fonts'; // Updated path
import {
  ensureClientSession,
  getCurrentClientAuthState,
  subscribeToAuthChanges,
} from './apps/mobile/src/features/auth/services/authService';

const EMPTY_AUTH_STATE = {
  session: null,
  user: null,
  profile: null,
  role: null,
  isClient: false,
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [authState, setAuthState] = useState(EMPTY_AUTH_STATE);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let validationVersion = 0;

    const init = async () => {
      setAuthLoading(true);
      try {
        const currentAuthState = await getCurrentClientAuthState();
        if (isMounted) {
          setAuthState(currentAuthState);
        }
      } catch (err) {
        console.warn('Auth init role validation error:', err?.message || err);
        if (isMounted) {
          setAuthState(EMPTY_AUTH_STATE);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    const handleAuthChange = async (_event, newSession) => {
      const currentVersion = ++validationVersion;

      if (!newSession) {
        if (isMounted) {
          setAuthState(EMPTY_AUTH_STATE);
          setAuthLoading(false);
        }
        return;
      }

      setAuthLoading(true);
      try {
        const nextAuthState = await ensureClientSession(newSession);
        if (isMounted && currentVersion === validationVersion) {
          setAuthState(nextAuthState);
        }
      } catch (err) {
        console.warn('Auth state role validation error:', err?.message || err);
        if (isMounted && currentVersion === validationVersion) {
          setAuthState(EMPTY_AUTH_STATE);
        }
      } finally {
        if (isMounted && currentVersion === validationVersion) {
          setAuthLoading(false);
        }
      }
    };

    init();
    const { data: listener } = subscribeToAuthChanges(handleAuthChange);

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const canOpenClientRoutes = authState.session && authState.isClient;

  return (
    <SafeAreaProvider>
      <MealsProvider>
        <DietitianConnectionProvider userId={authState.user?.id}>
          <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />
          <NavigationContainer>
            {canOpenClientRoutes ? <RootNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </DietitianConnectionProvider>
      </MealsProvider>
    </SafeAreaProvider>
  );
}
