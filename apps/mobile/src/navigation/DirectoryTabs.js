import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DietitianDirectoryScreen from '../features/dietitianDirectory/screens/DietitianDirectoryScreen';
import InquiryListScreen from '../features/dietitianDirectory/screens/InquiryListScreen';
import ProfileScreen from '../features/clients/screens/ProfileScreen';
import { useDietitianDirectory } from '../features/dietitianDirectory/context/DietitianDirectoryContext';
import { createTabScreenOptions } from './tabBarOptions';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
    Diyetisyenler: 'search',
    Mesajlar: 'message',
    Profil: 'person',
};

// Tabs for a client without an active dietitian: browse dietitians, talk to
// them before connecting, and manage their own profile and settings.
const DirectoryTabs = () => {
    const insets = useSafeAreaInsets();
    const { unreadCount } = useDietitianDirectory();

    return (
        <Tab.Navigator screenOptions={createTabScreenOptions({ insets, icons: TAB_ICONS })}>
            <Tab.Screen
                name="Diyetisyenler"
                component={DietitianDirectoryScreen}
                options={{ tabBarAccessibilityLabel: 'Diyetisyenler sekmesi' }}
            />
            <Tab.Screen
                name="Mesajlar"
                component={InquiryListScreen}
                options={{
                    tabBarAccessibilityLabel: unreadCount > 0 ? `Mesajlar sekmesi, ${unreadCount} okunmamış mesaj` : 'Mesajlar sekmesi',
                    tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : undefined,
                }}
            />
            <Tab.Screen
                name="Profil"
                component={ProfileScreen}
                initialParams={{ asTab: true }}
                options={{ tabBarAccessibilityLabel: 'Profil sekmesi' }}
            />
        </Tab.Navigator>
    );
};

export default DirectoryTabs;
