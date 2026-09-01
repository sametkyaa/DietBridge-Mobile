import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, StatusBar, View } from 'react-native';
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
import { NotificationProvider } from './apps/mobile/src/features/notifications/context/NotificationContext';
import PushLifecycleController from './apps/mobile/src/features/push/components/PushLifecycleController';
import './apps/mobile/src/shared/theme/fonts'; // Updated path
import {
  establishPasswordRecoverySession,
  ensureClientSession,
  getCurrentClientAuthState,
  isPasswordRecoverySessionActive,
  signOut,
  subscribeToAuthChanges,
} from './apps/mobile/src/features/auth/services/authService';
import {
  isNativePasswordRecoveryDestination,
  PASSWORD_RECOVERY_INVALID_MESSAGE,
} from './apps/mobile/src/features/auth/utils/passwordRecoveryContract.cjs';

const EMPTY_AUTH_STATE = {
  session: null,
  user: null,
  profile: null,
  role: null,
  isClient: false,
};

const INITIAL_RECOVERY_STATE = {
  status: 'idle',
  errorMessage: null,
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
  const [recoveryState, setRecoveryState] = useState(INITIAL_RECOVERY_STATE);
  const [authEntryRoute, setAuthEntryRoute] = useState('Login');
  const recoveryModeRef = useRef(false);
  const recoveryOperationRef = useRef(0);
  const appMountedRef = useRef(true);

  const exitRecoveryFlow = async (nextRoute = 'Login') => {
    recoveryOperationRef.current += 1;
    setAuthLoading(true);

    try {
      await signOut();
    } finally {
      if (!appMountedRef.current) return;

      recoveryModeRef.current = false;
      setAuthState(EMPTY_AUTH_STATE);
      setAuthEntryRoute(nextRoute);
      setRecoveryState(INITIAL_RECOVERY_STATE);
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    appMountedRef.current = true;
    let isMounted = true;
    let validationVersion = 0;
    const initialUrlCheckedRef = { current: false };

    const processRecoveryUrl = async (url) => {
      if (!isMounted) return { handled: true, stale: true };

      if (!isNativePasswordRecoveryDestination(url)) {
        return { handled: false };
      }

      const operationVersion = ++recoveryOperationRef.current;
      validationVersion += 1;
      recoveryModeRef.current = true;
      setRecoveryState({ status: 'processing', errorMessage: null });
      setAuthState(EMPTY_AUTH_STATE);
      setAuthLoading(true);

      let result;
      try {
        result = await establishPasswordRecoverySession(url);
      } catch (_error) {
        result = {
          ok: false,
          message: PASSWORD_RECOVERY_INVALID_MESSAGE,
        };
      }

      if (!isMounted || operationVersion !== recoveryOperationRef.current) {
        return { handled: true, stale: true };
      }

      if (result.ok) {
        setRecoveryState({ status: 'ready', errorMessage: null });
        setAuthState(EMPTY_AUTH_STATE);
        setAuthLoading(false);
        return { handled: true, ok: true };
      }

      setRecoveryState({
        status: 'invalid',
        errorMessage: result.message || PASSWORD_RECOVERY_INVALID_MESSAGE,
      });
      setAuthState(EMPTY_AUTH_STATE);
      setAuthLoading(false);
      return { handled: true, ok: false };
    };

    const init = async () => {
      setAuthLoading(true);

      let initialUrl = null;
      try {
        initialUrl = await Linking.getInitialURL();
      } catch (_error) {
        initialUrl = null;
      }

      if (initialUrl) {
        const recoveryResult = await processRecoveryUrl(initialUrl);
        initialUrlCheckedRef.current = true;
        if (recoveryResult.handled) return;
      } else {
        initialUrlCheckedRef.current = true;
      }

      if (!isMounted || recoveryModeRef.current) return;

      try {
        const currentAuthState = await getCurrentClientAuthState();
        if (isMounted && !recoveryModeRef.current) {
          setAuthState(currentAuthState);
        }
      } catch (err) {
        console.warn('Auth init role validation error:', err?.message || err);
        if (isMounted && !recoveryModeRef.current) {
          setAuthState(EMPTY_AUTH_STATE);
        }
      } finally {
        if (isMounted && !recoveryModeRef.current) {
          setAuthLoading(false);
        }
      }
    };

    const handleAuthChange = async (event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        if (!recoveryModeRef.current) {
          recoveryModeRef.current = true;
          recoveryOperationRef.current += 1;
          setRecoveryState({
            status: 'invalid',
            errorMessage: PASSWORD_RECOVERY_INVALID_MESSAGE,
          });
        } else if (isPasswordRecoverySessionActive()) {
          setRecoveryState((currentState) => (
            currentState.status === 'processing'
              ? { status: 'ready', errorMessage: null }
              : currentState
          ));
        }

        setAuthState(EMPTY_AUTH_STATE);
        setAuthLoading(false);
        return;
      }

      if (!initialUrlCheckedRef.current || recoveryModeRef.current) return;

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

    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      void processRecoveryUrl(url);
    });
    const { data: listener } = subscribeToAuthChanges(handleAuthChange);
    void init();

    return () => {
      isMounted = false;
      appMountedRef.current = false;
      recoveryOperationRef.current += 1;
      listener?.subscription?.unsubscribe();
      urlSubscription?.remove();
    };
  }, []);

  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFB' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const canOpenClientRoutes = !recoveryModeRef.current
    && recoveryState.status === 'idle'
    && authState.session
    && authState.isClient;
  const isRecoveryFlow = recoveryState.status !== 'idle';

  return (
    <SafeAreaProvider>
      <PushLifecycleController session={canOpenClientRoutes ? authState.session : null} />
      <MealsProvider userId={authState.user?.id || null}>
        <DietitianConnectionProvider userId={authState.user?.id || null}>
          <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />
          <NavigationContainer>
            {canOpenClientRoutes ? (
              <NotificationProvider userId={authState.user?.id || null}>
                <RootNavigator />
              </NotificationProvider>
            ) : (
              <AuthNavigator
                key={`${isRecoveryFlow ? 'recovery' : 'auth'}:${authEntryRoute}`}
                initialRouteName={isRecoveryFlow ? 'ResetPassword' : authEntryRoute}
                recoveryStatus={recoveryState.status}
                recoveryError={recoveryState.errorMessage}
                onRecoverySuccess={() => exitRecoveryFlow('Login')}
                onRecoveryCancel={() => exitRecoveryFlow('Login')}
                onRequestAnotherLink={() => exitRecoveryFlow('ForgotPassword')}
              />
            )}
          </NavigationContainer>
        </DietitianConnectionProvider>
      </MealsProvider>
    </SafeAreaProvider>
  );
}
