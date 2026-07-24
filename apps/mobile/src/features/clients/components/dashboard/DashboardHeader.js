import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const getInitials = (name) => String(name || 'K')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR');

export function DashboardHeader({ greeting, userName, dateLabel, avatarUrl, onAvatarPress }) {
    return (
        <View style={styles.root}>
            <View style={styles.textWrap}>
                <Text style={styles.greeting} accessibilityRole="header" numberOfLines={1}>{greeting}, {userName}</Text>
                <Text style={styles.date}>{dateLabel}</Text>
            </View>
            <Pressable
                onPress={onAvatarPress}
                accessibilityRole="button"
                accessibilityLabel="Menüyü aç"
                style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
            >
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} accessibilityLabel={`${userName} profil fotoğrafı`} />
                ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.initials}>{getInitials(userName)}</Text>
                    </View>
                )}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    textWrap: { flex: 1, minWidth: 0 },
    greeting: { ...typography.screenTitle, fontSize: 24, lineHeight: 30, color: colors.textPrimary },
    date: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    avatarButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    avatar: { width: 42, height: 42, borderRadius: radius.round },
    avatarFallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    initials: { ...typography.bodyMedium, color: colors.primaryDark },
    pressed: { opacity: 0.8 },
});

export default DashboardHeader;
