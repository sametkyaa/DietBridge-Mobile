import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../../../../shared/components/ui';
import { colors, radius, spacing } from '../../../../shared/theme';

export function MealPhotoPreviewModal({ uri, onClose }) {
    return (
        <Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <SafeAreaView style={styles.root} accessibilityViewIsModal>
                <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fotoğraf önizlemesini kapat" />
                <View style={styles.content} pointerEvents="box-none">
                    {uri ? <Image source={{ uri }} style={styles.image} resizeMode="contain" accessibilityLabel="Öğün fotoğrafı önizlemesi" /> : null}
                    <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Kapat" style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                        <Icon name="close" size={24} color={colors.white} />
                    </Pressable>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'rgba(12, 18, 13, 0.88)', justifyContent: 'center' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    content: { height: '82%', margin: spacing.x5, justifyContent: 'center' },
    image: { width: '100%', height: '100%', borderRadius: radius.card, backgroundColor: colors.textPrimary },
    close: { position: 'absolute', top: spacing.x3, right: spacing.x3, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(30, 40, 32, 0.72)', alignItems: 'center', justifyContent: 'center' },
    pressed: { opacity: 0.8 },
});

export default MealPhotoPreviewModal;
