import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton, AppInput, BottomSheetView, InlineAlert } from '../../../../shared/components/ui';
import { colors, typography } from '../../../../shared/theme';

export function ProfileEditSheet({ visible, form, onChange, onSave, onClose, isSaving, error, bottomInset }) {
    return (
        <BottomSheetView visible={visible} onClose={isSaving ? () => {} : onClose} title="Profil bilgilerini düzenle" scrollable bottomInset={bottomInset} footer={<AppButton label="Değişiklikleri kaydet" onPress={onSave} loading={isSaving} disabled={isSaving} />}>
            <Text style={styles.note}>Güncel kilo Dashboard’daki kilo kaydı üzerinden yönetilir.</Text>
            {error ? <InlineAlert variant="error" message={error} /> : null}
            <AppInput label="Ad soyad" value={form.fullName} onChangeText={(value) => onChange('fullName', value)} editable={!isSaving} autoCapitalize="words" />
            <AppInput label="Telefon" value={form.phone} onChangeText={(value) => onChange('phone', value)} editable={!isSaving} keyboardType="phone-pad" />
            <AppInput label="Hedef kilo (kg)" value={form.targetWeight} onChangeText={(value) => onChange('targetWeight', value)} editable={!isSaving} keyboardType="decimal-pad" placeholder="0,0" />
            <AppInput label="Boy (cm)" value={form.heightCm} onChangeText={(value) => onChange('heightCm', value)} editable={!isSaving} keyboardType="decimal-pad" placeholder="0,0" />
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({ note: { ...typography.supporting, color: colors.textSecondary } });
export default ProfileEditSheet;
