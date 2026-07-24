import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppButton, AppInput, BottomSheetView, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import {
    getUniqueCaseInsensitiveValues,
    normalizeMultiValue,
} from '../utils/profileValueUtils';

const normalizeKey = (value) => String(value).trim().toLocaleLowerCase('tr-TR');

const DislikedFoodsModal = ({
    visible,
    selectedValues = [],
    loading = false,
    onClose,
    onSave,
    bottomInset = 0,
}) => {
    const [draftValues, setDraftValues] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLockRef = useRef(false);

    useEffect(() => {
        if (!visible) return;
        setDraftValues(normalizeMultiValue(selectedValues));
        setInputValue('');
        setErrorMessage('');
        setIsSubmitting(false);
        submitLockRef.current = false;
    }, [selectedValues, visible]);

    const isBusy = loading || isSubmitting;
    const trimmedInput = inputValue.trim();
    const canAdd = trimmedInput.length > 0 && !isBusy;
    const initialKeys = useMemo(
        () => normalizeMultiValue(selectedValues).map(normalizeKey).sort(),
        [selectedValues],
    );
    const draftKeys = useMemo(
        () => draftValues.map(normalizeKey).sort(),
        [draftValues],
    );
    const hasUnsavedChanges = trimmedInput.length > 0
        || JSON.stringify(initialKeys) !== JSON.stringify(draftKeys);

    const addValue = () => {
        if (!canAdd || submitLockRef.current) return;

        if (draftValues.some((value) => normalizeKey(value) === normalizeKey(trimmedInput))) {
            setErrorMessage('Bu besin zaten listede.');
            return;
        }

        setDraftValues((currentValues) => (
            getUniqueCaseInsensitiveValues([...currentValues, trimmedInput])
        ));
        setInputValue('');
        setErrorMessage('');
    };

    const removeValue = (valueToRemove) => {
        if (isBusy || submitLockRef.current) return;
        const valueKey = normalizeKey(valueToRemove);
        setErrorMessage('');
        setDraftValues((currentValues) => (
            currentValues.filter((value) => normalizeKey(value) !== valueKey)
        ));
    };

    const handleClose = () => {
        if (isBusy || submitLockRef.current) return;
        const close = () => {
            Keyboard.dismiss();
            onClose();
        };
        if (!hasUnsavedChanges) {
            close();
            return;
        }
        Alert.alert('Kaydedilmemiş değişiklikler', 'Değişiklikleri kaydetmeden çıkmak istiyor musunuz?', [
            { text: 'Düzenlemeye devam et', style: 'cancel' },
            { text: 'Kaydetmeden çık', style: 'destructive', onPress: close },
        ]);
    };

    const handleSave = async () => {
        if (isBusy || submitLockRef.current) return;

        try {
            submitLockRef.current = true;
            setIsSubmitting(true);
            setErrorMessage('');
            await onSave(getUniqueCaseInsensitiveValues(draftValues));
            Keyboard.dismiss();
            onClose();
        } catch (error) {
            setErrorMessage(error?.message || 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            submitLockRef.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <BottomSheetView
            visible={visible}
            onClose={handleClose}
            title="Sevilmeyen besinleri düzenle"
            scrollable
            bottomInset={bottomInset}
            footer={(
                <AppButton
                    label="Kaydet"
                    onPress={handleSave}
                    loading={isBusy}
                    disabled={isBusy}
                />
            )}
        >
            {draftValues.length > 0 ? (
                <View style={styles.chipContainer}>
                    {draftValues.map((value) => (
                        <View key={normalizeKey(value)} style={styles.chip}>
                            <Text style={styles.chipText} numberOfLines={2}>{value}</Text>
                            <Pressable
                                onPress={() => removeValue(value)}
                                disabled={isBusy}
                                accessibilityRole="button"
                                accessibilityLabel={`${value} besinini listeden kaldır`}
                                accessibilityState={{ disabled: isBusy }}
                                hitSlop={8}
                                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                            >
                                <Ionicons name="close-circle" size={18} color={colors.primaryDark} />
                            </Pressable>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.empty}>Henüz sevilmeyen besin eklemediniz.</Text>
            )}

            <View style={styles.inputRow}>
                <AppInput
                    value={inputValue}
                    onChangeText={(value) => {
                        setInputValue(value);
                        setErrorMessage('');
                    }}
                    placeholder="Örneğin brokoli"
                    accessibilityLabel="Sevilmeyen besin adı"
                    editable={!isBusy}
                    returnKeyType="done"
                    onSubmitEditing={addValue}
                    blurOnSubmit={false}
                    autoCapitalize="sentences"
                    style={styles.input}
                />
                <AppButton
                    variant="secondary"
                    label="Ekle"
                    onPress={addValue}
                    disabled={!canAdd}
                    accessibilityLabel="Besini listeye ekle"
                    style={styles.addButton}
                />
            </View>

            {!!errorMessage && (
                <InlineAlert variant="error" message={errorMessage} />
            )}
        </BottomSheetView>
    );
};

const styles = StyleSheet.create({
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.x2,
    },
    chip: {
        minHeight: 44,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x1,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.control,
        paddingLeft: spacing.x3,
        paddingRight: spacing.x2,
        paddingVertical: spacing.x2,
    },
    chipText: {
        flexShrink: 1,
        ...typography.supporting,
        color: colors.primaryDark,
        fontFamily: typography.bodyMedium.fontFamily,
    },
    removeButton: {
        minWidth: 32,
        minHeight: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    empty: {
        ...typography.supporting,
        color: colors.textSecondary,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.x2,
    },
    input: {
        flex: 1,
    },
    addButton: {
        minWidth: 88,
    },
    pressed: {
        opacity: 0.7,
    },
});

export default DislikedFoodsModal;
