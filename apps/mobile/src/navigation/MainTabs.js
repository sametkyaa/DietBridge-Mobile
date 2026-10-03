import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../features/clients/screens/DashboardScreen';
import MealsScreen from '../features/meals/screens/MealsScreen';
import AnalysisScreen from '../features/analytics/screens/AnalysisScreen';
import ChatScreen from '../features/clients/screens/ChatScreen';
import { Icon } from '../shared/components/ui';
import { colors, radius, spacing, typography } from '../shared/theme';

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
                tabBarInactiveTintColor: colors.textTertiary,
                tabBarStyle: {
                    height: tabBarHeight,
                    paddingTop: spacing.x2,
                    paddingBottom: tabBarBottomPadding,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: colors.borderStrong,
                    backgroundColor: colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarItemStyle: styles.tabItem,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIconStyle: styles.tabIcon,
                tabBarIcon: ({ color, focused }) => (
                    <View style={styles.iconWrap}>
                        <View style={[styles.indicator, focused && styles.indicatorActive]} />
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
        fontSize: 11,
        marginTop: spacing.x1,
    },
    tabIcon: {
        marginTop: 0,
    },
    iconWrap: {
        width: 34,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    indicator: {
        position: 'absolute',
        top: -spacing.x2,
        width: 18,
        height: 3,
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
        backgroundColor: 'transparent',
    },
    indicatorActive: {
        backgroundColor: colors.primaryDark,
    },
});

export default MainTabs;
