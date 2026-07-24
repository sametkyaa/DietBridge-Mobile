import React from 'react';
import { AppButton, AppInput, BottomSheetView } from '../../../shared/components/ui';

export function WeightEntrySheet({ visible, value, onChange, onSave, onClose, isSaving, bottomInset }) {
    return (
        <BottomSheetView
            visible={visible}
            onClose={onClose}
            title="Kilo ekle"
            bottomInset={bottomInset}
            footer={<AppButton label="Kilo kaydet" onPress={onSave} loading={isSaving} disabled={isSaving} />}
        >
            <AppInput
                label="Kilo (kg)"
                value={value}
                onChangeText={onChange}
                keyboardType="decimal-pad"
                placeholder="0,0"
                editable={!isSaving}
                accessibilityLabel="Kilo, kilogram"
            />
        </BottomSheetView>
    );
}

export default WeightEntrySheet;
