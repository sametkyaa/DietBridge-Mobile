import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { Icon } from '../../../shared/components/ui';
import { formatNotificationBadge } from '../utils/notificationUiUtils.cjs';

export function NotificationBell({ unseenCount = 0, onPress }) {
    const badge = formatNotificationBadge(unseenCount);
    const accessibilityLabel = badge
        ? `Bildirimleri aç, ${unseenCount} görülmemiş bildirim`
        : 'Bildirimleri aç';

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityHint="Bildirim merkezini açar"
            hitSlop={4}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
            <Icon name="bell" size={22} color={colors.textPrimary} />
            {badge ? (
                <View
                    pointerEvents="none"
                    style={styles.badge}
                    accessible={false}
                    importantForAccessibility="no"
                >
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            ) : null}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 44,
        height: 44,
        borderRadius: radius.round,
        backgroundColor: colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -3,
        minWidth: 18,
        height: 18,
        paddingHorizontal: spacing.x1,
        borderRadius: radius.round,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    badgeText: {
        ...typography.caption,
        fontSize: 10,
        lineHeight: 13,
        color: colors.white,
        textAlign: 'center',
    },
    pressed: { opacity: 0.75 },
});

export default NotificationBell;
