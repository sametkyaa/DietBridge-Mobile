import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, BottomSheetView, ChoiceChip, InlineAlert } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

export function ProfileFieldSheet({ visible, title, value, options, multiline, placeholder, onChange, onSave, onClose, isSaving, error, bottomInset }) {
    const hasRequiredOptions = !Array.isArray(options) || options.length > 0;
    return (
        <BottomSheetView visible={visible} onClose={isSaving ? () => {} : onClose} title={title} scrollable bottomInset={bottomInset} footer={<AppButton label="Kaydet" onPress={onSave} loading={isSaving} disabled={isSaving || !hasRequiredOptions} />}>
            {error ? <InlineAlert variant="error" message={error} /> : null}
            {Array.isArray(options) ? (
                options.length ? <View style={styles.chips}>{options.map((option) => <ChoiceChip key={String(option.id)} label={option.label} selected={String(value) === String(option.id)} onPress={() => onChange(option.id)} disabled={isSaving} />)}</View>
                    : <Text style={styles.empty}>Seçenekler yüklenemedi. Lütfen daha sonra tekrar deneyin.</Text>
            ) : (
                <AppInput label={title} accessibilityLabel={title} value={String(value || '')} onChangeText={onChange} placeholder={placeholder} multiline={multiline} numberOfLines={multiline ? 4 : 1} editable={!isSaving} inputStyle={multiline ? styles.multiline : undefined} />
            )}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
    empty: { ...typography.supporting, color: colors.textSecondary },
    multiline: { minHeight: 104, textAlignVertical: 'top' },
});
export default ProfileFieldSheet;
