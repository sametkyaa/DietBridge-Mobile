import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { formatDecimalValue, normalizeDecimalInput } from '../utils/profileValueUtils';

const isValidStep = (value, minimum, step) => {
    if (!step) return true;
    const stepCount = (value - minimum) / step;
    return Math.abs(stepCount - Math.round(stepCount)) < 0.000001;
};

const NumericProfileInputModal = ({
    visible,
    title,
    value,
    unit,
    placeholder,
    minimum,
    maximum,
    step,
    loading = false,
    validationMessage,
    onClose,
    onSave,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLockRef = useRef(false);
    const isBusy = loading || isSubmitting;
    const initialValue = value === null || value === undefined ? '' : formatDecimalValue(value);
    const hasUnsavedChanges = normalizeDecimalInput(inputValue) !== normalizeDecimalInput(initialValue);

    useEffect(() => {
        if (!visible) return;
        setInputValue(value === null || value === undefined ? '' : formatDecimalValue(value));
        setErrorMessage('');
        setIsSubmitting(false);
        submitLockRef.current = false;
    }, [value, visible]);

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

        const normalizedValue = normalizeDecimalInput(inputValue);
        const parsedValue = normalizedValue === '' ? null : Number.parseFloat(normalizedValue);
        const isInvalid = parsedValue !== null && (
            !/^\d+(?:\.\d+)?$/.test(normalizedValue)
            ||
            !Number.isFinite(parsedValue)
            || parsedValue < minimum
            || parsedValue > maximum
            || !isValidStep(parsedValue, minimum, step)
        );

        if (isInvalid) {
            setErrorMessage(
                validationMessage
                || `Lütfen ${minimum} ile ${maximum} ${unit} arasında geçerli bir değer girin.`,
            );
            return;
        }

        try {
            submitLockRef.current = true;
            setIsSubmitting(true);
            setErrorMessage('');
            await onSave(parsedValue);
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
                                <Text style={styles.modalTitle}>{title}</Text>
                                <View style={styles.inputRow}>
                                    <TextInput
                                        style={styles.input}
                                        value={inputValue}
                                        onChangeText={(nextValue) => {
                                            setInputValue(nextValue);
                                            setErrorMessage('');
                                        }}
                                        keyboardType="decimal-pad"
                                        placeholder={placeholder}
                                        placeholderTextColor={colors.textTertiary}
                                        editable={!isBusy}
                                        returnKeyType="done"
                                        onSubmitEditing={handleSave}
                                        accessibilityLabel={title}
                                    />
                                    <Text style={styles.unitText}>{unit}</Text>
                                </View>

                                {!!errorMessage && (
                                    <Text style={styles.errorText} accessibilityRole="alert">
                                        {errorMessage}
                                    </Text>
                                )}

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
        padding: spacing.x4,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        padding: spacing.x5,
    },
    modalTitle: {
        ...typography.cardTitle,
        color: colors.textPrimary,
        marginBottom: spacing.x5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        borderRadius: radius.control,
        paddingHorizontal: spacing.x3,
    },
    input: {
        flex: 1,
        minHeight: 50,
        ...typography.body,
        color: colors.textPrimary,
    },
    unitText: {
        ...typography.bodyMedium,
        color: colors.textSecondary,
        marginLeft: spacing.x2,
    },
    errorText: {
        ...typography.supporting,
        color: colors.errorDark,
        marginTop: spacing.x3,
    },
    actions: {
        flexDirection: 'row',
        marginTop: spacing.x5,
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

export default NumericProfileInputModal;
