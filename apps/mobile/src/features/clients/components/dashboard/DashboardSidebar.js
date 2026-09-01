import React from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../../shared/components/ui';
import { colors, radius, shadows, spacing, typography } from '../../../../shared/theme';

const ITEMS = [
    { key: 'Profile', label: 'Profil', icon: 'person' },
    { key: 'Appointments', label: 'Randevular', icon: 'calendar' },
    { key: 'GroceryList', label: 'Alışveriş listesi', icon: 'cart' },
    { key: 'Settings', label: 'Ayarlar', icon: 'settings' },
    { key: 'Support', label: 'Destek', icon: 'support' },
];

export function DashboardSidebar({ visible, userName, avatarUrl, onClose, onNavigate, topInset = 0 }) {
    const insets = useSafeAreaInsets();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.overlay} accessibilityViewIsModal>
                <View style={[
                    styles.panel,
                    {
                        paddingTop: spacing.x6 + Math.max(topInset, insets.top),
                        paddingBottom: spacing.x6 + insets.bottom,
                        paddingLeft: spacing.x5 + insets.left,
                        paddingRight: spacing.x5 + insets.right,
                    },
                ]}>
                    <View style={styles.profile}>
                        {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} accessible={false} /> : <View style={styles.avatar} />}
                        <Text style={styles.name}>{userName}</Text>
                    </View>
                    {ITEMS.map((item) => (
                        <Pressable
                            key={item.key}
                            onPress={() => onNavigate(item.key)}
                            accessibilityRole="button"
                            accessibilityLabel={item.label}
                            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                        >
                            <Icon name={item.icon} size={22} color={colors.textPrimary} />
                            <Text style={styles.itemText}>{item.label}</Text>
                            <Icon name="chevronRight" color={colors.textTertiary} />
                        </Pressable>
                    ))}
                </View>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Menüyü kapat" />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(30, 40, 32, 0.45)' },
    panel: { width: '78%', maxWidth: 340, height: '100%', backgroundColor: colors.surface, paddingHorizontal: spacing.x5, ...shadows.hero },
    backdrop: { flex: 1 },
    profile: { alignItems: 'center', paddingBottom: spacing.x6 },
    avatar: { width: 72, height: 72, borderRadius: radius.round, backgroundColor: colors.surfaceMuted },
    name: { ...typography.cardTitle, color: colors.textPrimary, marginTop: spacing.x2 },
    item: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderTopWidth: 1, borderTopColor: colors.borderSoft },
    itemText: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    pressed: { opacity: 0.75 },
});

export default DashboardSidebar;
