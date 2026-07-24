import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Icon } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const initials = (name) => String(name || 'K').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR');

export function ProfileHeaderCard({ name, avatarUrl, isSelecting, isUploading, onAvatarPress, onEdit }) {
    return (
        <AppCard>
            <View style={styles.row}>
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
                    <View style={styles.camera}><Icon name="camera" size={15} color={colors.white} /></View>
                </Pressable>
                <View style={styles.textWrap}>
                    <Text style={styles.name} accessibilityRole="header">{name || 'Profilim'}</Text>
                    <Text style={styles.supporting}>Profil ve sağlık tercihlerinizi yönetin.</Text>
                </View>
            </View>
            <View style={styles.actions}>
                <AppButton variant="secondary" label="Kişisel bilgileri düzenle" onPress={onEdit} style={styles.edit} />
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4 },
    avatarButton: { width: 76, height: 76 },
    avatar: { width: 72, height: 72, borderRadius: radius.round },
    fallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    initials: { ...typography.cardTitle, color: colors.primaryDark },
    camera: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.white },
    textWrap: { flex: 1, minWidth: 0 },
    name: { ...typography.screenTitle, fontSize: 22, lineHeight: 28, color: colors.textPrimary },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    actions: { marginTop: spacing.x4 },
    edit: { width: '100%' },
    pressed: { opacity: 0.8 },
});

export default ProfileHeaderCard;
