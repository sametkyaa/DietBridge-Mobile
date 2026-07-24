import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../features/clients/screens/DashboardScreen';
import MealsScreen from '../features/meals/screens/MealsScreen';
import AnalysisScreen from '../features/analytics/screens/AnalysisScreen';
import ChatScreen from '../features/clients/screens/ChatScreen';
import { Icon } from '../shared/components/ui';
import { colors, radius, shadows, spacing, typography } from '../shared/theme';

const Tab = createBottomTabNavigator();
const TAB_BAR_CONTENT_HEIGHT = 60;

const TAB_ICONS = {
    'Ana Sayfa': 'home',
    Öğünler: 'meal',
    Analiz: 'analytics',
    Sohbet: 'message',
};

const MainTabs = () => {
    const insets = useSafeAreaInsets();
    const tabBarBottomPadding = Math.max(insets.bottom, spacing.x2);
    const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + tabBarBottomPadding;

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarHideOnKeyboard: true,
                tabBarActiveTintColor: colors.primaryDark,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarStyle: {
                    height: tabBarHeight,
                    paddingTop: spacing.x2,
                    paddingBottom: tabBarBottomPadding,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderSoft,
                    borderTopLeftRadius: radius.hero,
                    borderTopRightRadius: radius.hero,
                    backgroundColor: colors.surface,
                    ...shadows.sheet,
                },
                tabBarItemStyle: styles.tabItem,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIconStyle: styles.tabIcon,
                tabBarIcon: ({ color, focused }) => (
                    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                        <Icon name={TAB_ICONS[route.name]} size={22} color={color} />
                    </View>
                ),
            })}
        >
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

const styles = StyleSheet.create({
    tabItem: {
        minHeight: 48,
        borderRadius: radius.control,
    },
    tabLabel: {
        ...typography.caption,
        marginTop: spacing.x1,
    },
    tabIcon: {
        marginTop: 0,
    },
    iconWrap: {
        width: 34,
        height: 28,
        borderRadius: radius.round,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconWrapActive: {
        backgroundColor: colors.primarySoft,
    },
});

export default MainTabs;
