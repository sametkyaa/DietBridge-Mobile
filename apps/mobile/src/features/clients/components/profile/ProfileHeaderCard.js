import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const initials = (name) => String(name || 'K').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR');

// Sits directly on the canvas: the avatar and name are the page's anchor,
// so they do not need a card around them.
export function ProfileHeaderCard({ name, avatarUrl, goal, isSelecting, isUploading, onAvatarPress, onEdit }) {
    return (
        <View style={styles.root}>
            <Pressable
                onPress={onAvatarPress}
                disabled={isSelecting || isUploading}
                accessibilityRole="button"
                accessibilityLabel="Profil fotoğrafını değiştir"
                accessibilityState={{ disabled: isSelecting || isUploading, busy: isSelecting || isUploading }}
                style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
            >
                {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} accessibilityLabel={`${name} profil fotoğrafı`} /> : (
                    <View style={[styles.avatar, styles.fallback]}><Text style={styles.initials}>{initials(name)}</Text></View>
                )}
                <View style={styles.camera}><Icon name="camera" size={14} color={colors.textOnPrimary} /></View>
            </Pressable>
            <Text style={styles.name} accessibilityRole="header">{name || 'Profilim'}</Text>
            {goal ? (
                <View style={styles.goal}>
                    <Icon name="leaf" size={14} color={colors.accentDark} />
                    <Text style={styles.goalText}>{goal}</Text>
                </View>
            ) : null}
            <Pressable
                onPress={onEdit}
                accessibilityRole="button"
                accessibilityLabel="Kişisel bilgileri düzenle"
                style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
            >
                <Icon name="edit" size={16} color={colors.primaryDark} />
                <Text style={styles.editLabel}>Bilgilerimi düzenle</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { alignItems: 'flex-start', gap: spacing.x2 },
    avatarButton: { width: 92, height: 92, marginBottom: spacing.x2 },
    avatar: { width: 88, height: 88, borderRadius: radius.round },
    fallback: { backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
    initials: { ...typography.display, fontSize: 30, color: colors.textOnPrimary },
    camera: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    name: { ...typography.display, color: colors.textPrimary },
    goal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x1,
        paddingHorizontal: spacing.x3,
        paddingVertical: spacing.x1,
        borderRadius: radius.round,
        backgroundColor: colors.accentSoft,
    },
    goalText: { ...typography.caption, fontFamily: typography.bodyMedium.fontFamily, color: colors.accentDark },
    edit: {
        minHeight: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x2,
        paddingHorizontal: spacing.x4,
        marginTop: spacing.x2,
        borderRadius: radius.round,
        backgroundColor: colors.surface,
    },
    editLabel: { ...typography.supporting, fontFamily: typography.button.fontFamily, color: colors.primaryDark },
    pressed: { opacity: 0.8 },
});

export default ProfileHeaderCard;
