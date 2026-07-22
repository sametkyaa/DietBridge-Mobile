import React, { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton, AppInput, BottomSheetView } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

export function MeasurementSheet({ visible, form, onChange, onSave, onClose, isSaving, bottomInset }) {
    const scrollRef = useRef(null);
    const handleClose = () => {
        if (!isSaving) onClose();
    };
    const update = (key, value) => onChange((current) => ({ ...current, [key]: value }));

    return (
        <BottomSheetView
            visible={visible}
            onClose={handleClose}
            title="Vücut ölçülerini düzenle"
            bottomInset={bottomInset}
            footer={(
                <>
                    <AppButton label="Ölçüleri kaydet" onPress={onSave} loading={isSaving} disabled={isSaving} />
                    <AppButton variant="text" label="İptal" onPress={handleClose} disabled={isSaving} style={styles.cancel} />
                </>
            )}
        >
            <ScrollView
                ref={scrollRef}
                style={styles.formScroll}
                contentContainerStyle={styles.form}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.supporting}>Doldurmak istemediğiniz alanları boş bırakabilirsiniz.</Text>
                <AppInput label="Bel (cm)" value={form.waistCm} onChangeText={(value) => update('waistCm', value)} keyboardType="decimal-pad" placeholder="0,0" editable={!isSaving} />
                <AppInput label="Kalça (cm)" value={form.hipCm} onChangeText={(value) => update('hipCm', value)} keyboardType="decimal-pad" placeholder="0,0" editable={!isSaving} />
                <AppInput
                    label="Kol (cm) · Sağ / Sol"
                    value={form.armCm}
                    onChangeText={(value) => update('armCm', value)}
                    onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
                    keyboardType="decimal-pad"
                    placeholder="0,0"
                    editable={!isSaving}
                />
            </ScrollView>
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    supporting: { ...typography.supporting, color: colors.textSecondary },
    formScroll: { flexShrink: 1 },
    form: { gap: spacing.x3, paddingBottom: spacing.x2 },
    cancel: { alignSelf: 'center' },
});

export default MeasurementSheet;
