import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../features/clients/screens/DashboardScreen';
import MealsScreen from '../features/meals/screens/MealsScreen';
import AnalysisScreen from '../features/analytics/screens/AnalysisScreen';
import ChatScreen from '../features/clients/screens/ChatScreen';
import { createTabScreenOptions } from './tabBarOptions';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    'Ana Sayfa': 'home',
    Öğünler: 'meal',
    Analiz: 'analytics',
    Sohbet: 'message',
};

const MainTabs = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator screenOptions={createTabScreenOptions({ insets, icons: TAB_ICONS })}>
            <Tab.Screen
                name="Ana Sayfa"
                component={DashboardScreen}
                options={{ tabBarAccessibilityLabel: 'Ana Sayfa sekmesi' }}
            />
            <Tab.Screen
                name="Öğünler"
                component={MealsScreen}
                options={{ tabBarAccessibilityLabel: 'Öğünler sekmesi' }}
            />
            <Tab.Screen
                name="Analiz"
                component={AnalysisScreen}
                options={{ tabBarAccessibilityLabel: 'Analiz sekmesi' }}
            />
            <Tab.Screen
                name="Sohbet"
                component={ChatScreen}
                options={{ tabBarAccessibilityLabel: 'Sohbet sekmesi' }}
            />
        </Tab.Navigator>
    );
};

export default MainTabs;
