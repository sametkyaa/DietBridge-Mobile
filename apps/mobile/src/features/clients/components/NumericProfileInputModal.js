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
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
                                        placeholderTextColor="#9CA3AF"
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
        padding: 16,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        color: '#111827',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 18,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 52,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    input: {
        flex: 1,
        minHeight: 50,
        color: '#1F2937',
        fontSize: 16,
    },
    unitText: {
        color: '#4B5563',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 8,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 13,
        lineHeight: 18,
        marginTop: 10,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 20,
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

export default NumericProfileInputModal;
