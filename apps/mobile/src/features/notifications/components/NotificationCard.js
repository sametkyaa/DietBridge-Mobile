import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import {
    formatNotificationContext,
    formatNotificationRelativeTime,
    formatNotificationSummary,
    getNotificationCategoryIcon,
} from '../utils/notificationUiUtils.cjs';

export function NotificationCard({ notification, onPress, disabled = false }) {
    const summary = useMemo(() => formatNotificationSummary(notification), [notification]);
    const context = useMemo(() => formatNotificationContext(notification), [notification]);
    const relativeTime = useMemo(
        () => formatNotificationRelativeTime(notification?.occurredAt),
        [notification?.occurredAt],
    );
    const isUnread = notification?.readAt === null;
    const accessibilityLabel = `${summary}${context ? ` ${context}.` : ''}${isUnread ? ' Okunmamış.' : ''}`;

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled, selected: isUnread }}
            style={({ pressed }) => [
                styles.card,
                isUnread && styles.unreadCard,
                pressed && !disabled && styles.pressed,
            ]}
        >
            <View style={[styles.iconWrap, isUnread && styles.unreadIconWrap]} accessible={false}>
                <Icon
                    name={getNotificationCategoryIcon(notification?.category)}
                    size={20}
                    color={isUnread ? colors.primaryDark : colors.textSecondary}
                />
            </View>
            <View style={styles.body}>
                <View style={styles.summaryRow}>
                    <Text style={[styles.summary, isUnread && styles.unreadText]}>{summary}</Text>
                    {isUnread ? <View style={styles.unreadDot} accessible={false} /> : null}
                </View>
                {context ? <Text style={styles.context} numberOfLines={1}>{context}</Text> : null}
                {relativeTime ? <Text style={styles.timestamp}>{relativeTime}</Text> : null}
            </View>
            <Icon name="chevronRight" size={16} color={colors.textTertiary} />
        </Pressable>
    );
}

// Unread rows sit on white cards with a spruce dot; read rows fall back onto
// the canvas so the eye lands on what is new first.
const styles = StyleSheet.create({
    card: {
        minHeight: 84,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x3,
        paddingVertical: spacing.x4,
        paddingHorizontal: spacing.x4,
        borderRadius: radius.card,
    },
    unreadCard: { backgroundColor: colors.surface },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: radius.round,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    unreadIconWrap: { backgroundColor: colors.primarySurface },
    body: { flex: 1, minWidth: 0, gap: 2 },
    summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2 },
    summary: { ...typography.body, color: colors.textSecondary, flex: 1 },
    unreadText: { fontFamily: typography.bodyMedium.fontFamily, color: colors.textPrimary },
    context: { ...typography.supporting, color: colors.textSecondary },
    timestamp: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.x1 },
    unreadDot: { width: 8, height: 8, borderRadius: radius.round, backgroundColor: colors.primary, marginTop: 7 },
    pressed: { opacity: 0.78 },
});

export default NotificationCard;
