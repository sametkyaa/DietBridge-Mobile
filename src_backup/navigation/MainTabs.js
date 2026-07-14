import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MealsScreen from '../features/meals/screens/MealsScreen';
import AnalysisScreen from '../screens/AnalysisScreen';
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  'Ana Sayfa': '🏠',
  Öğünler: '🍱',
  Analiz: '📊',
  Sohbet: '💬',
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#4CAF50',
      tabBarStyle: { paddingVertical: 6, height: 60 },
      tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
    })}
  >
    <Tab.Screen name="Ana Sayfa" component={HomeScreen} />
    <Tab.Screen name="Öğünler" component={MealsScreen} />
    <Tab.Screen name="Analiz" component={AnalysisScreen} />
    <Tab.Screen name="Sohbet" component={ChatScreen} />
  </Tab.Navigator>
);

export default MainTabs;
