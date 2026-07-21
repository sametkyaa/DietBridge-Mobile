import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton, AppInput, BottomSheetView } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

export function MeasurementSheet({ visible, form, onChange, onSave, onClose, isSaving, bottomInset }) {
    const handleClose = () => {
        if (!isSaving) onClose();
    };
    const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));
    return (
        <BottomSheetView
            visible={visible}
            onClose={handleClose}
            title="Vücut ölçülerini düzenle"
            scrollable
            bottomInset={bottomInset}
            footer={(
                <>
                    <AppButton label="Ölçüleri kaydet" onPress={onSave} loading={isSaving} disabled={isSaving} />
                    <AppButton variant="text" label="İptal" onPress={handleClose} disabled={isSaving} style={styles.cancel} />
                </>
            )}
        >
            <Text style={styles.supporting}>Doldurmak istemediğiniz alanları boş bırakabilirsiniz.</Text>
            <AppInput label="Bel (cm)" value={form.waistCm} onChangeText={(value) => update('waistCm', value)} keyboardType="decimal-pad" placeholder="0,0" editable={!isSaving} />
            <AppInput label="Kalça (cm)" value={form.hipCm} onChangeText={(value) => update('hipCm', value)} keyboardType="decimal-pad" placeholder="0,0" editable={!isSaving} />
            <AppInput label="Kol (cm) · Sağ / Sol" value={form.armCm} onChangeText={(value) => update('armCm', value)} keyboardType="decimal-pad" placeholder="0,0" editable={!isSaving} />
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    supporting: { ...typography.supporting, color: colors.textSecondary },
    cancel: { alignSelf: 'center' },
});

export default MeasurementSheet;
