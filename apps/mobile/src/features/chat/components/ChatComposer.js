import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CHAT_MESSAGE_MAX_LENGTH } from '../constants/chatConstants';
import { Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import {
    canSendChatComposer,
    getChatImagePickerUiState,
    getChatImageUploadErrorMessage,
    getChatImageUploadStatusLabel,
    hasChatImageSelection,
    isChatImageUploadInFlight,
    shouldClearChatImageComposerAfterSuccess,
    shouldShowChatImageRetry,
} from '../utils/chatImageUiState';

const EMPTY_UPLOAD_STATE = { status: 'idle', source: null, previewUri: null, error: null, retryStage: null };

export default function ChatComposer({
    draft,
    onChangeDraft,
    onSubmit,
    disabled,
    isSending,
    sendError,
    featureEnabled = false,
    conversationId = null,
    imageUpload,
}) {
    const uploadState = imageUpload?.state || EMPTY_UPLOAD_STATE;

    const characterCount = Array.from(draft || '').length;
    const overLimit = characterCount > CHAT_MESSAGE_MAX_LENGTH;
    const counterText = useMemo(() => `${characterCount}/${CHAT_MESSAGE_MAX_LENGTH}`, [characterCount]);

    const picker = getChatImagePickerUiState(featureEnabled, conversationId, disabled);
    const imageSelected = hasChatImageSelection(uploadState);
    const uploadInFlight = isChatImageUploadInFlight(uploadState);
    const uploadStatusLabel = getChatImageUploadStatusLabel(uploadState);
    const uploadErrorMessage = getChatImageUploadErrorMessage(uploadState);
    const showRetry = shouldShowChatImageRetry(uploadState);
    const pickerDisabled = !picker.enabled || imageSelected || uploadInFlight;

    // On a successful image send the hook clears its own state; the composer
    // then clears the caption draft and resets the slot back to idle.
    useEffect(() => {
        if (imageUpload && shouldClearChatImageComposerAfterSuccess(uploadState)) {
            onChangeDraft('');
            imageUpload.reset?.();
        }
    }, [imageUpload, onChangeDraft, uploadState]);

    // A single send-gate. Text-only behavior is unchanged when no image is
    // selected; an in-flight image upload blocks any new send.
    const canSend = canSendChatComposer(draft, isSending, disabled, imageUpload ? uploadState : null);
    const sendDisabled = !canSend || overLimit || uploadInFlight;

    const handleSend = () => {
        if (sendDisabled) return;
        if (imageSelected) {
            // Image branch: the shared draft field carries the optional caption.
            imageUpload?.startUpload?.(draft);
            return;
        }
        // Text-only branch is preserved exactly.
        onSubmit();
    };

    const placeholder = imageSelected ? 'Açıklama ekleyin (isteğe bağlı)' : 'Mesajınızı yazın';

    return (
        <View style={styles.root}>
            {sendError ? <Text style={styles.sendError} accessibilityLiveRegion="polite">{sendError}</Text> : null}
            {picker.disabledMessage ? (
                <Text style={styles.pickerHint} accessibilityLiveRegion="polite">{picker.disabledMessage}</Text>
            ) : null}

            {imageSelected ? (
                <View style={styles.previewRow}>
                    {uploadState.previewUri ? (
                        <Image
                            source={{ uri: uploadState.previewUri }}
                            style={styles.previewImage}
                            accessibilityLabel="Seçilen görsel önizlemesi"
                        />
                    ) : (
                        <View style={styles.previewFallback}>
                            <Icon name="image" size={22} color={colors.textSecondary} />
                        </View>
                    )}
                    <View style={styles.previewMeta}>
                        {uploadStatusLabel ? (
                            <Text style={styles.uploadStatus} accessibilityLiveRegion="polite">{`${uploadStatusLabel}…`}</Text>
                        ) : (
                            <Text style={styles.previewLabel}>Görsel gönderilecek</Text>
                        )}
                        {uploadErrorMessage ? <Text style={styles.uploadError}>{uploadErrorMessage}</Text> : null}
                        <View style={styles.previewActions}>
                            {showRetry ? (
                                <Pressable
                                    onPress={() => imageUpload?.retry?.()}
                                    accessibilityRole="button"
                                    accessibilityLabel="Görseli tekrar gönder"
                                    hitSlop={8}
                                    style={({ pressed }) => [styles.previewAction, pressed && styles.pressed]}
                                >
                                    <Icon name="undo" size={16} color={colors.primaryDark} />
                                    <Text style={styles.previewActionText}>Tekrar dene</Text>
                                </Pressable>
                            ) : null}
                            <Pressable
                                onPress={() => imageUpload?.cancel?.()}
                                accessibilityRole="button"
                                accessibilityLabel="Görseli kaldır"
                                hitSlop={8}
                                style={({ pressed }) => [styles.previewAction, pressed && styles.pressed]}
                            >
                                <Icon name="close" size={16} color={colors.errorDark} />
                                <Text style={styles.previewActionRemove}>{uploadInFlight ? 'İptal et' : 'Kaldır'}</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            ) : null}

            <View style={[styles.inputRow, overLimit && styles.inputRowError]}>
                {picker.visible ? (
                    <Pressable
                        onPress={pickerDisabled ? undefined : () => imageUpload?.selectImage?.()}
                        disabled={pickerDisabled}
                        accessibilityRole="button"
                        accessibilityLabel="Görsel seç"
                        accessibilityState={{ disabled: pickerDisabled }}
                        hitSlop={8}
                        style={({ pressed }) => [styles.imageButton, pickerDisabled && styles.imageButtonDisabled, pressed && !pickerDisabled && styles.pressed]}
                    >
                        <Icon name="image" size={22} color={pickerDisabled ? colors.textTertiary : colors.primaryDark} />
                    </Pressable>
                ) : null}
                <TextInput
                    value={draft}
                    onChangeText={onChangeDraft}
                    onSubmitEditing={handleSend}
                    multiline
                    blurOnSubmit={false}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textTertiary}
                    style={styles.input}
                    editable={!disabled}
                    maxLength={undefined}
                    accessibilityLabel="Mesaj metni"
                    accessibilityHint={`En fazla ${CHAT_MESSAGE_MAX_LENGTH} karakter. Göndermek için gönder düğmesini kullanın.`}
                    textAlignVertical="top"
                    scrollEnabled
                />
                <Pressable
                    onPress={sendDisabled ? undefined : handleSend}
                    disabled={sendDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={isSending || uploadInFlight ? 'Mesaj gönderiliyor' : 'Mesajı gönder'}
                    accessibilityState={{ disabled: sendDisabled, busy: isSending || uploadInFlight }}
                    hitSlop={8}
                    style={({ pressed }) => [styles.sendButton, sendDisabled && styles.sendButtonDisabled, pressed && !sendDisabled && styles.pressed]}
                >
                    <Icon name="send" size={21} color={sendDisabled ? colors.textTertiary : colors.white} />
                </Pressable>
            </View>
            <Text style={[styles.counter, overLimit && styles.counterError]} accessibilityLiveRegion="polite">
                {overLimit ? `Mesaj en fazla ${CHAT_MESSAGE_MAX_LENGTH} karakter olabilir (${counterText})` : counterText}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flexShrink: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingHorizontal: spacing.x4, paddingTop: spacing.x2, paddingBottom: spacing.x2 },
    sendError: { ...typography.supporting, color: colors.errorDark, marginBottom: spacing.x2 },
    pickerHint: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.x2 },
    previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3, marginBottom: spacing.x2, padding: spacing.x2, borderRadius: radius.control, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderSoft },
    previewImage: { width: 56, height: 56, borderRadius: radius.control, backgroundColor: colors.surfaceMuted },
    previewFallback: { width: 56, height: 56, borderRadius: radius.control, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted },
    previewMeta: { flex: 1, gap: spacing.x1 },
    previewLabel: { ...typography.supporting, color: colors.textPrimary },
    uploadStatus: { ...typography.supporting, color: colors.primaryDark },
    uploadError: { ...typography.caption, color: colors.errorDark },
    previewActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.x4, marginTop: spacing.x1 },
    previewAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.x1, minHeight: 32 },
    previewActionText: { ...typography.caption, color: colors.primaryDark },
    previewActionRemove: { ...typography.caption, color: colors.errorDark },
    imageButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, marginBottom: 1, marginRight: spacing.x1 },
    imageButtonDisabled: { opacity: 0.6 },
    inputRow: { minHeight: 50, flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.control, backgroundColor: colors.background, paddingLeft: spacing.x3, paddingRight: spacing.x1, paddingVertical: spacing.x1 },
    inputRowError: { borderColor: colors.error },
    input: { ...typography.body, color: colors.textPrimary, flex: 1, maxHeight: 112, minHeight: 38, paddingTop: spacing.x2, paddingBottom: spacing.x2, paddingRight: spacing.x2 },
    sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, marginBottom: 1 },
    sendButtonDisabled: { backgroundColor: colors.surfaceMuted },
    counter: { ...typography.caption, color: colors.textTertiary, textAlign: 'right', marginTop: spacing.x1 },
    counterError: { color: colors.errorDark },
    pressed: { opacity: 0.76 },
});
