import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { colors, radius, spacing, typography } from '../../../shared/theme';
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
    const initialKeys = useMemo(
        () => normalizeMultiValue(selectedValues).map(normalizeKey).sort(),
        [selectedValues],
    );
    const draftKeys = useMemo(
        () => draftValues.map(normalizeKey).sort(),
        [draftValues],
    );
    const hasUnsavedChanges = customValue.trim().length > 0
        || JSON.stringify(initialKeys) !== JSON.stringify(draftKeys);

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
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            statusBarTranslucent
            navigationBarTranslucent
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                        <View style={styles.overlay}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle} accessibilityRole="header">{title}</Text>

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
                                                        <Ionicons name="checkmark" size={16} color={colors.white} />
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
                                                        <Ionicons name="close-circle" size={18} color={colors.primaryDark} />
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
                                            placeholderTextColor={colors.textSecondary}
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
                                        accessibilityLabel="Kaydet"
                                        accessibilityState={{ disabled: isBusy, busy: isBusy }}
                                    >
                                        {isBusy ? (
                                            <ActivityIndicator size="small" color={colors.white} />
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
        paddingHorizontal: spacing.x4,
        paddingVertical: spacing.x3,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 560,
        maxHeight: '92%',
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.x5,
    },
    modalTitle: {
        ...typography.cardTitle,
        color: colors.textPrimary,
        marginBottom: spacing.x4,
    },
    scrollView: {
        flexShrink: 1,
    },
    scrollContent: {
        paddingBottom: spacing.x2,
    },
    sectionLabel: {
        ...typography.supporting,
        color: colors.textSecondary,
        fontFamily: typography.bodyMedium.fontFamily,
        marginBottom: spacing.x2,
        marginTop: spacing.x1,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: spacing.x4,
    },
    optionChip: {
        minHeight: 44,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.x1,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        borderRadius: radius.control,
        paddingHorizontal: spacing.x3,
        paddingVertical: spacing.x2,
        marginRight: spacing.x2,
        marginBottom: spacing.x2,
    },
    optionChipSelected: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    optionText: {
        flexShrink: 1,
        ...typography.supporting,
        color: colors.textPrimary,
        fontFamily: typography.bodyMedium.fontFamily,
    },
    optionTextSelected: {
        color: colors.white,
    },
    selectedChip: {
        minHeight: 44,
        maxWidth: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x2,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: radius.control,
        paddingHorizontal: spacing.x3,
        paddingVertical: spacing.x2,
        marginRight: spacing.x2,
        marginBottom: spacing.x2,
    },
    selectedChipText: {
        flexShrink: 1,
        ...typography.supporting,
        color: colors.primaryDark,
        fontFamily: typography.bodyMedium.fontFamily,
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: spacing.x1,
    },
    input: {
        flex: 1,
        minHeight: 48,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        borderRadius: radius.control,
        paddingHorizontal: spacing.x3,
        ...typography.body,
        color: colors.textPrimary,
    },
    addButton: {
        minWidth: 72,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.control,
        marginLeft: spacing.x2,
        paddingHorizontal: spacing.x4,
    },
    addButtonText: {
        ...typography.button,
        color: colors.textPrimary,
    },
    errorText: {
        ...typography.supporting,
        color: colors.errorDark,
        marginTop: spacing.x2,
    },
    actions: {
        flexDirection: 'row',
        marginTop: spacing.x4,
    },
    cancelButton: {
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceMuted,
        borderRadius: radius.control,
        marginRight: spacing.x2,
    },
    cancelButtonText: {
        ...typography.button,
        color: colors.textSecondary,
    },
    saveButton: {
        flex: 1,
        minHeight: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryDark,
        borderRadius: radius.control,
        marginLeft: spacing.x2,
    },
    saveButtonText: {
        ...typography.button,
        color: colors.white,
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default MultiSelectProfileModal;
