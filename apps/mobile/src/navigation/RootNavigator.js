import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import ProfileScreen from '../features/clients/screens/ProfileScreen';
import SettingsScreen from '../features/clients/screens/SettingsScreen';
import SupportScreen from '../features/clients/screens/SupportScreen';
import AppointmentsScreen from '../features/appointments/screens/AppointmentsScreen';
import AppointmentDetailScreen from '../features/appointments/screens/AppointmentDetailScreen';
import NotificationCenterScreen from '../features/notifications/screens/NotificationCenterScreen';
import GroceryListScreen from '../features/grocery/screens/GroceryListScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Appointments" component={AppointmentsScreen} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
            <Stack.Screen name="NotificationCenter" component={NotificationCenterScreen} />
            <Stack.Screen name="GroceryList" component={GroceryListScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
        </Stack.Navigator>
    );
};

export default RootNavigator;
