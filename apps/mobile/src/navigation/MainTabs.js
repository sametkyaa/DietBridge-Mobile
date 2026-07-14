import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../features/clients/screens/DashboardScreen';
import MealsScreen from '../features/meals/screens/MealsScreen';
import AnalysisScreen from '../features/analytics/screens/AnalysisScreen';
import ChatScreen from '../features/clients/screens/ChatScreen';

const Tab = createBottomTabNavigator();
const TAB_BAR_BASE_HEIGHT = 64;

const TAB_ICONS = {
    'Ana Sayfa': '🏠',
    Öğünler: '🍱',
    Analiz: '📊',
    Sohbet: '💬',
};

const MainTabs = () => {
    const insets = useSafeAreaInsets();
    const tabBarBottomPadding = Math.max(insets.bottom, 10);
    const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#4CAF50',
                tabBarStyle: {
                    height: tabBarHeight,
                    paddingTop: 6,
                    paddingBottom: tabBarBottomPadding,
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                    backgroundColor: '#FFFFFF',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    paddingBottom: 0,
                },
                tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
            })}
        >
            <Tab.Screen name="Ana Sayfa" component={DashboardScreen} />
            <Tab.Screen name="Öğünler" component={MealsScreen} />
            <Tab.Screen name="Analiz" component={AnalysisScreen} />
            <Tab.Screen name="Sohbet" component={ChatScreen} />
        </Tab.Navigator>
    );
};

export default MainTabs;
