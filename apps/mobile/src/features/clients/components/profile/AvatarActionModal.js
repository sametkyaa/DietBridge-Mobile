import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, Icon } from '../../../../shared/components/ui';
import { colors, radius, shadows, spacing, typography } from '../../../../shared/theme';

export function AvatarActionModal({ visible, hasAvatar, onClose, onSelectSource, onRemove, disabled }) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.overlay} accessibilityViewIsModal>
                <Pressable style={styles.backdrop} onPress={disabled ? undefined : onClose} accessibilityRole="button" accessibilityLabel="Fotoğraf işlemlerini kapat" />
                <View style={styles.dialog}>
                    <Pressable
                        onPress={onClose}
                        disabled={disabled}
                        accessibilityRole="button"
                        accessibilityLabel="Fotoğraf işlemlerini kapat"
                        accessibilityState={{ disabled }}
                        style={({ pressed }) => [styles.closeButton, pressed && !disabled && styles.pressed]}
                    >
                        <Icon name="close" size={20} color={colors.textPrimary} />
                    </Pressable>
                    <Text style={styles.title} accessibilityRole="header">Profil fotoğrafı</Text>
                    <Text style={styles.description}>Yapmak istediğiniz işlemi seçin.</Text>
                    <View style={styles.actions}>
                        <AppButton variant="text" label="Fotoğraf çek" onPress={() => onSelectSource('camera')} disabled={disabled} />
                        <AppButton variant="text" label="Galeriden seç" onPress={() => onSelectSource('gallery')} disabled={disabled} />
                        {hasAvatar ? <AppButton variant="text" label="Fotoğrafı kaldır" onPress={onRemove} disabled={disabled} textStyle={styles.removeLabel} /> : null}
                        <AppButton variant="text" label="İptal" onPress={onClose} disabled={disabled} />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(30, 40, 32, 0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.x5 },
    backdrop: { ...StyleSheet.absoluteFillObject },
    dialog: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.x5, ...shadows.card },
    closeButton: { position: 'absolute', top: spacing.x2, right: spacing.x2, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    title: { ...typography.sectionTitle, color: colors.textPrimary, paddingRight: spacing.x8 },
    description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.x2 },
    actions: { alignItems: 'flex-end', marginTop: spacing.x4 },
    removeLabel: { color: colors.errorDark },
    pressed: { opacity: 0.75 },
});

export default AvatarActionModal;
