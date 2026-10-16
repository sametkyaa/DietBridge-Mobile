import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../shared/components/ui';
import { colors, radius, spacing, typography } from '../shared/theme';

const TAB_BAR_CONTENT_HEIGHT = 60;

// Shared bottom tab look for the full app tabs and the directory tabs.
export const createTabScreenOptions = ({ insets, icons }) => {
    const tabBarBottomPadding = Math.max(insets.bottom, spacing.x2);
    const tabBarHeight = TAB_BAR_CONTENT_HEIGHT + tabBarBottomPadding;

    return ({ route }) => ({
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
                <Icon name={icons[route.name]} size={22} color={color} />
            </View>
        ),
    });
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
