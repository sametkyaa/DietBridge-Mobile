import React from 'react';
import { Animated, Image, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../../shared/components/ui';
import { useModalTransition } from '../../../../shared/hooks/useModalTransition';
import { colors, radius, shadows, spacing, typography } from '../../../../shared/theme';

const ITEMS = [
    { key: 'Profile', label: 'Profil', icon: 'person' },
    { key: 'Appointments', label: 'Randevular', icon: 'calendar' },
    { key: 'Settings', label: 'Ayarlar', icon: 'settings' },
    { key: 'Support', label: 'Destek', icon: 'support' },
];

const getInitials = (name) => String(name || 'K')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('tr-TR');

export function DashboardSidebar({ visible, userName, avatarUrl, onClose, onNavigate, topInset = 0 }) {
    const insets = useSafeAreaInsets();
    const { width: windowWidth } = useWindowDimensions();
    const { mounted, progress } = useModalTransition(visible, { duration: 300 });
    const panelWidth = Math.min(windowWidth * 0.8, 340);
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-panelWidth - 24, 0] });

    return (
        <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.overlay} accessibilityViewIsModal>
                <Animated.View pointerEvents="none" style={[styles.scrim, { opacity: progress }]} />
                <Animated.View style={[
                    styles.panel,
                    { transform: [{ translateX }] },
                    {
                        paddingTop: spacing.x6 + Math.max(topInset, insets.top),
                        paddingBottom: spacing.x6 + insets.bottom,
                        paddingLeft: spacing.x5 + insets.left,
                        paddingRight: spacing.x5 + insets.right,
                    },
                ]}>
                    <View style={styles.profile}>
                        {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} accessible={false} /> : (
                            <View style={[styles.avatar, styles.avatarFallback]}>
                                <Text style={styles.initials}>{getInitials(userName)}</Text>
                            </View>
                        )}
                        <Text style={styles.name}>{userName}</Text>
                        <Text style={styles.caption}>Danışan hesabı</Text>
                    </View>
                    <View style={styles.group}>
                        {ITEMS.map((item, index) => (
                            <Pressable
                                key={item.key}
                                onPress={() => onNavigate(item.key)}
                                accessibilityRole="button"
                                accessibilityLabel={item.label}
                                style={({ pressed }) => [styles.item, index > 0 && styles.itemDivider, pressed && styles.pressed]}
                            >
                                <Icon name={item.icon} size={21} color={colors.primaryDark} />
                                <Text style={styles.itemText}>{item.label}</Text>
                                <Icon name="chevronRight" size={18} color={colors.textTertiary} />
                            </Pressable>
                        ))}
                    </View>
                </Animated.View>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Menüyü kapat" />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row' },
    scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(28, 43, 38, 0.36)' },
    panel: { width: '80%', maxWidth: 340, height: '100%', backgroundColor: colors.background, paddingHorizontal: spacing.x5, borderTopRightRadius: radius.hero, borderBottomRightRadius: radius.hero, ...shadows.sheet },
    backdrop: { flex: 1 },
    profile: { alignItems: 'flex-start', paddingBottom: spacing.x6 },
    avatar: { width: 64, height: 64, borderRadius: radius.round, backgroundColor: colors.surface },
    avatarFallback: { alignItems: 'center', justifyContent: 'center' },
    initials: { ...typography.sectionTitle, color: colors.primaryDark },
    name: { ...typography.screenTitle, fontSize: 22, lineHeight: 28, color: colors.textPrimary, marginTop: spacing.x4 },
    caption: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    group: { backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: spacing.x4 },
    item: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    itemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    itemText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    pressed: { opacity: 0.75 },
});

export default DashboardSidebar;
