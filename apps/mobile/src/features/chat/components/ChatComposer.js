import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CHAT_MESSAGE_MAX_LENGTH } from '../constants/chatConstants';
import { Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';

export default function ChatComposer({ draft, onChangeDraft, onSubmit, disabled, isSending, sendError }) {
    const characterCount = Array.from(draft || '').length;
    const overLimit = characterCount > CHAT_MESSAGE_MAX_LENGTH;
    const hasText = Boolean(String(draft || '').trim());
    const sendDisabled = disabled || isSending || !hasText || overLimit;
    const counterText = useMemo(() => `${characterCount}/${CHAT_MESSAGE_MAX_LENGTH}`, [characterCount]);

    return (
        <View style={styles.root}>
            {sendError ? <Text style={styles.sendError} accessibilityLiveRegion="polite">{sendError}</Text> : null}
            <View style={[styles.inputRow, overLimit && styles.inputRowError]}>
                <TextInput
                    value={draft}
                    onChangeText={onChangeDraft}
                    onSubmitEditing={onSubmit}
                    multiline
                    blurOnSubmit={false}
                    placeholder="Mesajınızı yazın"
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
                    onPress={sendDisabled ? undefined : onSubmit}
                    disabled={sendDisabled}
                    accessibilityRole="button"
                    accessibilityLabel={isSending ? 'Mesaj gönderiliyor' : 'Mesajı gönder'}
                    accessibilityState={{ disabled: sendDisabled, busy: isSending }}
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
    inputRow: { minHeight: 50, flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.control, backgroundColor: colors.background, paddingLeft: spacing.x3, paddingRight: spacing.x1, paddingVertical: spacing.x1 },
    inputRowError: { borderColor: colors.error },
    input: { ...typography.body, color: colors.textPrimary, flex: 1, maxHeight: 112, minHeight: 38, paddingTop: spacing.x2, paddingBottom: spacing.x2, paddingRight: spacing.x2 },
    sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark, marginBottom: 1 },
    sendButtonDisabled: { backgroundColor: colors.surfaceMuted },
    counter: { ...typography.caption, color: colors.textTertiary, textAlign: 'right', marginTop: spacing.x1 },
    counterError: { color: colors.errorDark },
    pressed: { opacity: 0.76 },
});
