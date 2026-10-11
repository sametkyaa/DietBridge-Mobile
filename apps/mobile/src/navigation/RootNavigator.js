import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
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

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { userId } = useDietitianConnection();
    const onboardingGate = useOnboardingGate(userId);

    if (onboardingGate.status === 'loading') {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
            </View>
        );
    }

    return (
        <Stack.Navigator
            initialRouteName={onboardingGate.showSetup ? 'OnboardingSetup' : 'MainTabs'}
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
            <Stack.Screen name="MainTabs" component={MainTabs} />
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
        </Stack.Navigator>
    );
};

export default RootNavigator;
