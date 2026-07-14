import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    getUniqueCaseInsensitiveValues,
    normalizeMultiValue,
} from '../utils/profileValueUtils';

const normalizeKey = (value) => String(value).trim().toLocaleLowerCase('tr-TR');

const MultiSelectProfileModal = ({
    visible,
    title,
    options = [],
    selectedValues = [],
    customInputLabel,
    customInputPlaceholder,
    loading = false,
    onClose,
    onSave,
}) => {
    const [draftValues, setDraftValues] = useState([]);
    const [customValue, setCustomValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLockRef = useRef(false);

    useEffect(() => {
        if (!visible) return;
        setDraftValues(normalizeMultiValue(selectedValues));
        setCustomValue('');
        setErrorMessage('');
        setIsSubmitting(false);
        submitLockRef.current = false;
    }, [selectedValues, visible]);

    const selectedKeys = useMemo(
        () => new Set(draftValues.map(normalizeKey)),
        [draftValues],
    );
    const isBusy = loading || isSubmitting;

    const toggleOption = (option) => {
        if (isBusy || submitLockRef.current) return;
        const optionKey = normalizeKey(option);
        setErrorMessage('');
        setDraftValues((currentValues) => (
            currentValues.some((value) => normalizeKey(value) === optionKey)
                ? currentValues.filter((value) => normalizeKey(value) !== optionKey)
                : getUniqueCaseInsensitiveValues([...currentValues, option])
        ));
    };

    const removeValue = (valueToRemove) => {
        if (isBusy || submitLockRef.current) return;
        const valueKey = normalizeKey(valueToRemove);
        setErrorMessage('');
        setDraftValues((currentValues) => (
            currentValues.filter((value) => normalizeKey(value) !== valueKey)
        ));
    };

    const addCustomValue = () => {
        if (isBusy || submitLockRef.current) return;
        const trimmedValue = customValue.trim();

        if (!trimmedValue) {
            setErrorMessage('Lütfen eklemek istediğiniz bilgiyi girin.');
            return;
        }

        if (selectedKeys.has(normalizeKey(trimmedValue))) {
            setErrorMessage('Bu bilgi zaten seçili.');
            return;
        }

        setDraftValues((currentValues) => (
            getUniqueCaseInsensitiveValues([...currentValues, trimmedValue])
        ));
        setCustomValue('');
        setErrorMessage('');
    };

    const handleClose = () => {
        if (isBusy || submitLockRef.current) return;
        Keyboard.dismiss();
        onClose();
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
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.overlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle}>{title}</Text>

                                <ScrollView
                                    style={styles.scrollView}
                                    contentContainerStyle={styles.scrollContent}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    <Text style={styles.sectionLabel}>Hazır seçenekler</Text>
                                    <View style={styles.chipContainer}>
                                        {options.map((option) => {
                                            const isSelected = selectedKeys.has(normalizeKey(option));
                                            return (
                                                <TouchableOpacity
                                                    key={option}
                                                    style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                                                    onPress={() => toggleOption(option)}
                                                    activeOpacity={0.75}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`${option} seçeneği`}
                                                    accessibilityState={{ selected: isSelected, disabled: isBusy }}
                                                    disabled={isBusy}
                                                >
                                                    {isSelected && (
                                                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                                    )}
                                                    <Text
                                                        style={[styles.optionText, isSelected && styles.optionTextSelected]}
                                                    >
                                                        {option}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>

                                    {draftValues.length > 0 && (
                                        <>
                                            <Text style={styles.sectionLabel}>Seçilenler</Text>
                                            <View style={styles.chipContainer}>
                                                {draftValues.map((value) => (
                                                    <TouchableOpacity
                                                        key={normalizeKey(value)}
                                                        style={styles.selectedChip}
                                                        onPress={() => removeValue(value)}
                                                        activeOpacity={0.75}
                                                        accessibilityRole="button"
                                                        accessibilityLabel={`${value} seçimini kaldır`}
                                                        disabled={isBusy}
                                                    >
                                                        <Text style={styles.selectedChipText} numberOfLines={2}>
                                                            {value}
                                                        </Text>
                                                        <Ionicons name="close-circle" size={18} color="#047857" />
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </>
                                    )}

                                    <Text style={styles.sectionLabel}>{customInputLabel}</Text>
                                    <View style={styles.customInputRow}>
                                        <TextInput
                                            style={styles.input}
                                            value={customValue}
                                            onChangeText={(value) => {
                                                setCustomValue(value);
                                                setErrorMessage('');
                                            }}
                                            placeholder={customInputPlaceholder}
                                            placeholderTextColor="#9CA3AF"
                                            returnKeyType="done"
                                            onSubmitEditing={addCustomValue}
                                            editable={!isBusy}
                                            accessibilityLabel={customInputLabel}
                                        />
                                        <TouchableOpacity
                                            style={[styles.addButton, isBusy && styles.disabledButton]}
                                            onPress={addCustomValue}
                                            disabled={isBusy}
                                            accessibilityRole="button"
                                            accessibilityLabel="Bilgiyi ekle"
                                        >
                                            <Text style={styles.addButtonText}>Ekle</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {!!errorMessage && (
                                        <Text style={styles.errorText} accessibilityRole="alert">
                                            {errorMessage}
                                        </Text>
                                    )}
                                </ScrollView>

                                <View style={styles.actions}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={handleClose}
                                        disabled={isBusy}
                                        accessibilityRole="button"
                                    >
                                        <Text style={styles.cancelButtonText}>İptal</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.saveButton, isBusy && styles.disabledButton]}
                                        onPress={handleSave}
                                        disabled={isBusy}
                                        accessibilityRole="button"
                                        accessibilityState={{ disabled: isBusy, busy: isBusy }}
                                    >
                                        {isBusy ? (
                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.saveButtonText}>Kaydet</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'rgba(17, 24, 39, 0.52)',
    },
    keyboardView: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 560,
        maxHeight: '92%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    scrollView: {
        flexShrink: 1,
    },
    scrollContent: {
        paddingBottom: 8,
    },
    sectionLabel: {
        color: '#4B5563',
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 4,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 14,
    },
    optionChip: {
        minHeight: 44,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginRight: 8,
        marginBottom: 8,
    },
    optionChipSelected: {
        backgroundColor: '#16A34A',
        borderColor: '#16A34A',
    },
    optionText: {
        flexShrink: 1,
        color: '#374151',
        fontSize: 14,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: '#FFFFFF',
    },
    selectedChip: {
        minHeight: 44,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 8,
        paddingHorizontal: 11,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
    },
    selectedChipText: {
        flexShrink: 1,
        color: '#065F46',
        fontSize: 14,
        fontWeight: '600',
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 4,
    },
    input: {
        flex: 1,
        minHeight: 48,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
        color: '#1F2937',
        fontSize: 15,
    },
    addButton: {
        minWidth: 72,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 8,
        marginLeft: 8,
        paddingHorizontal: 14,
    },
    addButtonText: {
        color: '#374151',
        fontSize: 14,
        fontWeight: '700',
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 6,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        marginRight: 6,
    },
    cancelButtonText: {
        color: '#4B5563',
        fontWeight: '700',
    },
    saveButton: {
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#16A34A',
        borderRadius: 8,
        marginLeft: 6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default MultiSelectProfileModal;
