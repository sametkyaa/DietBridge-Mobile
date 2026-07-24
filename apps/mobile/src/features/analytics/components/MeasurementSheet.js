import React, { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { AppButton, AppInput, BottomSheetView } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

const FIELDS = [
    { key: 'waistCm', label: 'Bel çevresi (cm)' },
    { key: 'hipCm', label: 'Kalça çevresi (cm)' },
    { key: 'rightArmCm', label: 'Sağ kol çevresi (cm)' },
    { key: 'leftArmCm', label: 'Sol kol çevresi (cm)' },
    { key: 'chestCm', label: 'Göğüs çevresi (cm)' },
    { key: 'rightCalfCm', label: 'Sağ baldır çevresi (cm)' },
    { key: 'leftCalfCm', label: 'Sol baldır çevresi (cm)' },
    { key: 'neckCm', label: 'Boyun çevresi (cm)' },
];

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
                {FIELDS.map((field) => (
                    <AppInput
                        key={field.key}
                        label={field.label}
                        value={form[field.key]}
                        onChangeText={(value) => update(field.key, value)}
                        onFocus={field.key === 'neckCm' ? () => scrollRef.current?.scrollToEnd({ animated: true }) : undefined}
                        keyboardType="decimal-pad"
                        placeholder="0,0"
                        editable={!isSaving}
                    />
                ))}
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
