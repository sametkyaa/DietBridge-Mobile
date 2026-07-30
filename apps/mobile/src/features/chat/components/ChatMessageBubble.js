import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { Icon } from '../../../shared/components/ui';
import {
    canDeleteChatMessage,
    formatChatMessageTime,
    getChatReceiptState,
} from '../utils/chatUiUtils';
import { getChatImageBubbleLabel } from '../utils/chatImageUiState';

export default function ChatMessageBubble({
    message,
    peerReadState,
    onRetry,
    onRequestDelete,
    isDeleting = false,
}) {
    const isOwn = Boolean(message?.isOwn);
    const isFailed = message?.deliveryState === 'failed';
    const isPending = message?.deliveryState === 'pending';
    const isDeleted = message?.isDeleted === true;
    const isImage = message?.messageKind === 'image' && !isDeleted;
    const imageLabel = isImage ? getChatImageBubbleLabel(message) : null;
    const imageCaption = isImage && typeof message?.body === 'string' && message.body.trim()
        ? message.body
        : null;
    const timeLabel = formatChatMessageTime(message?.createdAt);
    const receiptState = getChatReceiptState({ message, peerReadState });
    const canDelete = canDeleteChatMessage(message) && !isDeleting;
    const receipt = receiptState === 'none' ? null : {
        icon: receiptState === 'sent' ? 'check' : 'checkDouble',
        label: receiptState === 'read' ? 'Okundu' : receiptState === 'delivered' ? 'Teslim edildi' : 'Gönderildi',
        color: receiptState === 'read' ? colors.info : colors.textTertiary,
    };

    const requestDelete = () => {
        if (canDelete) onRequestDelete?.(message);
    };

    return (
        <View style={[styles.row, isOwn ? styles.ownRow : styles.otherRow]}>
            <Pressable
                onLongPress={requestDelete}
                delayLongPress={350}
                disabled={!canDelete}
                accessibilityRole={canDelete ? 'button' : undefined}
                accessibilityHint={canDelete ? 'Mesaj seçeneklerini açmak için basılı tutun.' : undefined}
                accessibilityActions={canDelete ? [{ name: 'delete', label: 'Mesajı sil' }] : undefined}
                onAccessibilityAction={({ nativeEvent }) => {
                    if (nativeEvent.actionName === 'delete') requestDelete();
                }}
                style={({ pressed }) => [
                    styles.bubble,
                    isOwn ? styles.ownBubble : styles.otherBubble,
                    isFailed && styles.failedBubble,
                    pressed && canDelete && styles.pressed,
                ]}
            >
                {isImage ? (
                    <View style={styles.imageContainer}>
                        <View style={[styles.imagePlaceholder, isOwn ? styles.ownImagePlaceholder : styles.otherImagePlaceholder]}>
                            <Icon name="image" size={26} color={isOwn ? colors.white : colors.textSecondary} />
                            <Text style={[styles.imageLabel, isOwn ? styles.ownBody : styles.otherBody]}>{imageLabel}</Text>
                        </View>
                        {imageCaption ? (
                            <Text style={[styles.body, styles.imageCaption, isOwn ? styles.ownBody : styles.otherBody]}>
                                {imageCaption}
                            </Text>
                        ) : null}
                    </View>
                ) : (
                    <Text style={[
                        styles.body,
                        isOwn ? styles.ownBody : styles.otherBody,
                        isDeleted && styles.deletedBody,
                    ]}>
                        {isDeleted ? 'Bu mesaj silindi' : message?.body}
                    </Text>
                )}
                <View style={styles.metaRow}>
                    {timeLabel ? (
                        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>{timeLabel}</Text>
                    ) : null}
                    {isPending ? (
                        <Icon name="clock" size={14} color={colors.primarySoft} accessible accessibilityLabel="Gönderiliyor" />
                    ) : null}
                    {isFailed ? (
                        <>
                            <Text style={styles.failedStatus}>Gönderilemedi</Text>
                            <Icon name="alert" size={14} color={colors.errorSoft} accessible accessibilityLabel="Gönderilemedi" />
                        </>
                    ) : null}
                    {isDeleting ? (
                        <Icon name="hourglass" size={14} color={colors.primarySoft} accessible accessibilityLabel="Mesaj siliniyor" />
                    ) : receipt ? (
                        <Icon name={receipt.icon} size={16} color={receipt.color} accessible accessibilityLabel={receipt.label} />
                    ) : null}
                </View>
                {isFailed && !isDeleted ? (
                    <Pressable
                        onPress={() => onRetry?.(message)}
                        accessibilityRole="button"
                        accessibilityLabel="Gönderilemeyen mesajı tekrar dene"
                        hitSlop={8}
                        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
                    >
                        <Icon name="undo" size={16} color={isOwn ? colors.white : colors.errorDark} />
                        <Text style={[styles.retryText, isOwn ? styles.ownRetryText : styles.otherRetryText]}>Tekrar dene</Text>
                    </Pressable>
                ) : null}
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { width: '100%', paddingHorizontal: spacing.x4, marginVertical: spacing.x1 },
    ownRow: { alignItems: 'flex-end' },
    otherRow: { alignItems: 'flex-start' },
    bubble: {
        maxWidth: '84%',
        borderRadius: radius.control,
        paddingHorizontal: spacing.x3,
        paddingVertical: spacing.x2,
    },
    ownBubble: { backgroundColor: colors.primaryDark, borderBottomRightRadius: spacing.x1 },
    otherBubble: { backgroundColor: colors.surfaceMuted, borderBottomLeftRadius: spacing.x1 },
    failedBubble: { borderWidth: 1, borderColor: colors.error },
    body: { ...typography.body, flexShrink: 1, flexWrap: 'wrap' },
    deletedBody: { fontStyle: 'italic', opacity: 0.82 },
    ownBody: { color: colors.white },
    otherBody: { color: colors.textPrimary },
    imageContainer: { flexShrink: 1 },
    imagePlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.x2,
        minWidth: 160,
        borderRadius: radius.control,
        paddingHorizontal: spacing.x3,
        paddingVertical: spacing.x3,
    },
    ownImagePlaceholder: { backgroundColor: colors.primarySurface },
    otherImagePlaceholder: { backgroundColor: colors.surface },
    imageLabel: { ...typography.body, fontWeight: '600' },
    imageCaption: { marginTop: spacing.x2 },
    metaRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: spacing.x1, marginTop: spacing.x1 },
    time: { ...typography.caption },
    ownTime: { color: colors.primarySoft },
    otherTime: { color: colors.textTertiary },
    failedStatus: { ...typography.caption, color: colors.errorSoft },
    retryButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: spacing.x1, minHeight: 32, marginTop: spacing.x1 },
    retryText: { ...typography.caption },
    ownRetryText: { color: colors.white },
    otherRetryText: { color: colors.errorDark },
    pressed: { opacity: 0.72 },
});
