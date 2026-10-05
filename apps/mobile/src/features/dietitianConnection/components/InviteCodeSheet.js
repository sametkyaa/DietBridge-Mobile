import React from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppInput, InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { useDietitianInviteViewModel } from '../viewmodels/useDietitianInviteViewModel';

export default function InviteCodeSheet({ code, userId, onClose, onComplete }) {
    const vm = useDietitianInviteViewModel({ initialCode: code, userId, onComplete });
    return (
        <Modal visible animationType="slide" onRequestClose={vm.busy ? undefined : onClose}>
            <SafeAreaView style={styles.safe}>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Text style={styles.title}>Diyetisyeninize bağlanın</Text>
                    <AppInput label="Diyetisyen kodu" value={vm.code} onChangeText={vm.changeCode} maxLength={64} autoCapitalize="characters" autoCorrect={false} editable={!vm.busy && !vm.completed} />
                    {vm.message ? <InlineAlert variant={vm.completed ? 'success' : 'error'} message={vm.message} /> : null}
                    {vm.profile ? (
                        <View style={styles.profile}>
                            {vm.profile.avatarUrl ? <Image accessibilityLabel="Diyetisyen profil fotoğrafı" source={{ uri: vm.profile.avatarUrl }} style={styles.avatar} /> : <View accessibilityLabel="Profil fotoğrafı yok" style={styles.avatar} />}
                            <Text style={styles.title}>{vm.profile.name}</Text>
                            <Text style={styles.text}>{vm.profile.title}</Text>
                            <Text style={styles.text}>Bağlandığınızda DietBridge’deki takip bilgileriniz bu diyetisyenle paylaşılacaktır.</Text>
                            <AppButton label="Bağlan" onPress={vm.redeem} loading={vm.busy} disabled={vm.completed} />
                        </View>
                    ) : <AppButton label="Devam" onPress={vm.preview} loading={vm.busy} disabled={vm.completed || !vm.code.trim()} />}
                    <Text style={styles.text}>Kodunuz yok mu? Diyetisyeninizden isteyin.</Text>
                    <AppButton label={vm.completed ? 'Kapat' : 'Vazgeç'} variant="secondary" disabled={vm.busy} onPress={onClose} />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.x6, gap: spacing.x4 },
    title: { ...typography.sectionTitle, color: colors.textPrimary },
    text: { ...typography.body, color: colors.textSecondary },
    profile: { gap: spacing.x4 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft },
});
