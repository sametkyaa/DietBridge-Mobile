import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeTabs, { useAppMode } from './HomeTabs';
import ProfileScreen from '../features/clients/screens/ProfileScreen';
import SettingsScreen from '../features/clients/screens/SettingsScreen';
import SupportScreen from '../features/clients/screens/SupportScreen';
import AppointmentsScreen from '../features/appointments/screens/AppointmentsScreen';
import AppointmentDetailScreen from '../features/appointments/screens/AppointmentDetailScreen';
import NotificationCenterScreen from '../features/notifications/screens/NotificationCenterScreen';
import GroceryListScreen from '../features/grocery/screens/GroceryListScreen';
import OnboardingSetupScreen from '../features/onboarding/screens/OnboardingSetupScreen';
import { useOnboardingGate } from '../features/onboarding/viewmodels/useOnboardingGate';
import { useDietitianConnection } from '../features/dietitianConnection/context/DietitianConnectionContext';
import { colors } from '../shared/theme';
import PushResponseController from '../features/push/components/PushResponseController';
import { DietitianDirectoryProvider } from '../features/dietitianDirectory/context/DietitianDirectoryContext';
import DietitianPublicProfileScreen from '../features/dietitianDirectory/screens/DietitianPublicProfileScreen';
import InquiryChatScreen from '../features/dietitianDirectory/screens/InquiryChatScreen';

const Stack = createNativeStackNavigator();
const DIRECTORY_ROUTES = new Set(['DietitianPublicProfile', 'InquiryChat']);

const RootNavigator = ({ navigationRef }) => {
    const { userId } = useDietitianConnection();
    const onboardingGate = useOnboardingGate(userId);
    const appMode = useAppMode();
    const previousAppModeRef = useRef(appMode);

    // When a directory client gets connected, leave any directory screen so
    // the full app opens on its home tab.
    useEffect(() => {
        const previousMode = previousAppModeRef.current;
        previousAppModeRef.current = appMode;
        if (previousMode !== 'directory' || appMode !== 'full') return;
        const route = navigationRef?.current?.getCurrentRoute?.();
        if (route && DIRECTORY_ROUTES.has(route.name)) {
            navigationRef.current.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
        }
    }, [appMode, navigationRef]);

    if (onboardingGate.status === 'loading') {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
        );
    }

    return (
        <DietitianDirectoryProvider userId={userId} enabled={appMode === 'directory'}>
        <PushResponseController userId={userId} navigationRef={navigationRef} enabled={!onboardingGate.showSetup} />
        <Stack.Navigator
            initialRouteName={onboardingGate.showSetup ? 'OnboardingSetup' : 'MainTabs'}
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
            <Stack.Screen name="MainTabs">
                {(props) => <HomeTabs {...props} mode={appMode} />}
            </Stack.Screen>
            <Stack.Screen name="OnboardingSetup" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }}>
                {(props) => <OnboardingSetupScreen {...props} userId={userId} />}
            </Stack.Screen>
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Appointments" component={AppointmentsScreen} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ animation: 'fade_from_bottom' }} />
            <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
            <Stack.Screen name="GroceryList" component={GroceryListScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="DietitianPublicProfile" component={DietitianPublicProfileScreen} />
            <Stack.Screen name="InquiryChat" component={InquiryChatScreen} />
        </Stack.Navigator>
        </DietitianDirectoryProvider>
    );
};

export default RootNavigator;
