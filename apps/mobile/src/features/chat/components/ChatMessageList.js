import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, EmptyState, ErrorState } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import ChatMessageBubble from './ChatMessageBubble';
import MealActivityCard from './MealActivityCard';
import { selectLatestVisibleCanonicalMessage } from '../utils/chatReadStatePolicy';
import { shouldAdjustInitialChatLayout, shouldPositionInitialChat } from '../utils/chatScrollLifecycle';

const getMessageKey = (message, index) => (
    message?.id || message?.optimisticId || message?.clientMessageId || `chat-message-${index}`
);

export default function ChatMessageList({
    messages,
    mealActivityError,
    isInitialLoading,
    initialError,
    onRetryInitial,
    nextCursor,
    isLoadingOlder,
    loadOlderError,
    onLoadOlder,
    onRetryOlder,
    onRetryMessage,
    onRequestDeleteMessage,
    deletingMessageIds,
    peerReadState,
    initialPositionToken,
    bottomScrollToken,
    realtimeScrollToken,
    conversationId,
    onLastVisibleCanonicalMessageChange,
    imageStates = {},
    onRetryImage,
}) {
    const listRef = useRef(null);
    const isNearBottomRef = useRef(true);
    const initialPositionedKeyRef = useRef(null);
    const initialLayoutAdjustedKeyRef = useRef(null);
    const conversationIdRef = useRef(conversationId);
    const visibleMessageCallbackRef = useRef(onLastVisibleCanonicalMessageChange);
    const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
    const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
        const latestMessage = selectLatestVisibleCanonicalMessage({
            viewableItems,
            conversationId: conversationIdRef.current,
        });
        visibleMessageCallbackRef.current?.(latestMessage);
    });
    const [viewerMessage, setViewerMessage] = React.useState(null);

    useEffect(() => {
        conversationIdRef.current = conversationId;
        visibleMessageCallbackRef.current = onLastVisibleCanonicalMessageChange;
    }, [conversationId, onLastVisibleCanonicalMessageChange]);
    useEffect(() => setViewerMessage(null), [conversationId]);

    const positionInitialLatest = (contentHeight) => {
        if (typeof contentHeight === 'number' && contentHeight <= 0) return;
        const positionKey = `${conversationId}:${initialPositionToken}`;
        if (shouldPositionInitialChat({
            conversationId,
            initialPositionToken,
            messageCount: Array.isArray(messages) ? messages.length : 0,
            positionedKey: initialPositionedKeyRef.current,
        })) {
            listRef.current?.scrollToEnd({ animated: false });
            initialPositionedKeyRef.current = positionKey;
            return;
        }

        if (shouldAdjustInitialChatLayout({
            conversationId,
            initialPositionToken,
            positionedKey: initialPositionedKeyRef.current,
            adjustedKey: initialLayoutAdjustedKeyRef.current,
            isNearBottom: isNearBottomRef.current,
        })) {
            listRef.current?.scrollToEnd({ animated: false });
            initialLayoutAdjustedKeyRef.current = positionKey;
        }
    };

    useEffect(() => {
        if (!bottomScrollToken) return undefined;
        const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
        return () => clearTimeout(timer);
    }, [bottomScrollToken]);

    // Realtime events only move the viewport when the user is already reading
    // the latest part of the thread. Pagination/prepended history keeps its
    // current anchor through maintainVisibleContentPosition.
    useEffect(() => {
        if (!isNearBottomRef.current) return undefined;
        const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0);
        return () => clearTimeout(timer);
    }, [realtimeScrollToken]);

    if (isInitialLoading) {
        return (
            <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel="Sohbet geçmişi yükleniyor" accessibilityState={{ busy: true }}>
                <ActivityIndicator size="large" color={colors.primaryDark} />
                <Text style={styles.loadingText}>Sohbet geçmişi yükleniyor…</Text>
            </View>
        );
    }

    if (initialError) {
        return (
            <ErrorState
                title="Sohbet geçmişi yüklenemedi"
                description={initialError}
                onRetry={onRetryInitial}
                style={styles.centered}
            />
        );
    }

    const renderHeader = () => {
        if (!nextCursor && !loadOlderError) return <View style={styles.headerSpacing} />;
        return (
            <View style={styles.olderSection}>
                {loadOlderError ? <Text style={styles.olderError}>{loadOlderError}</Text> : null}
                {nextCursor ? (
                    <AppButton
                        variant="text"
                        label={isLoadingOlder ? 'Eski mesajlar yükleniyor…' : loadOlderError ? 'Tekrar dene' : 'Eski mesajları yükle'}
                        onPress={loadOlderError ? onRetryOlder : onLoadOlder}
                        loading={isLoadingOlder}
                        disabled={isLoadingOlder}
                        accessibilityLabel={loadOlderError ? 'Eski mesajları yüklemeyi tekrar dene' : 'Eski mesajları yükle'}
                    />
                ) : null}
            </View>
        );
    };

    return (
        <>
        <FlatList
            ref={listRef}
            style={styles.list}
            data={Array.isArray(messages) ? messages : []}
            keyExtractor={getMessageKey}
            renderItem={({ item }) => (
                item?.kind === 'meal_activity' ? (
                    <MealActivityCard activity={item} />
                ) : (
                    <ChatMessageBubble
                        message={item}
                        peerReadState={peerReadState}
                        onRetry={onRetryMessage}
                        onRequestDelete={onRequestDeleteMessage}
                        isDeleting={Boolean(item?.id && deletingMessageIds?.includes(item.id))}
                        imageState={imageStates[item?.id]}
                        onRetryImage={() => onRetryImage?.(item)}
                        onOpenImage={() => setViewerMessage(item)}
                    />
                )
            )}
            ListHeaderComponent={() => (
                <>
                    {mealActivityError ? <Text style={styles.activityError} accessibilityRole="alert">{mealActivityError}</Text> : null}
                    {renderHeader()}
                </>
            )}
            ListEmptyComponent={(
                <EmptyState
                    icon="message"
                    title="Henüz mesaj yok"
                    description="Diyetisyeninizle ilk mesajı siz başlatabilirsiniz."
                    style={styles.emptyState}
                />
            )}
            contentContainerStyle={styles.content}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            onContentSizeChange={(_, contentHeight) => positionInitialLatest(contentHeight)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            viewabilityConfig={viewabilityConfigRef.current}
            onViewableItemsChanged={onViewableItemsChangedRef.current}
            scrollEventThrottle={16}
            onScroll={({ nativeEvent }) => {
                const distanceFromBottom = nativeEvent.contentSize.height
                    - nativeEvent.layoutMeasurement.height
                    - nativeEvent.contentOffset.y;
                isNearBottomRef.current = distanceFromBottom < 96;
            }}
            accessibilityLabel="Sohbet mesajları"
        />
        <Modal visible={Boolean(viewerMessage)} transparent animationType="fade" onRequestClose={() => setViewerMessage(null)}>
            <View style={styles.viewerBackdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={() => setViewerMessage(null)} accessibilityLabel="Görseli kapat" />
                <View style={styles.viewerContent}>
                    {imageStates[viewerMessage?.id]?.uri ? <Image source={{ uri: imageStates[viewerMessage.id].uri }} style={styles.viewerImage} resizeMode="contain" accessibilityLabel={viewerMessage?.body?.trim() || 'Görsel'} /> : null}
                    {viewerMessage?.body?.trim() ? <Text style={styles.viewerCaption}>{viewerMessage.body.trim()}</Text> : null}
                    <AppButton variant="secondary" label="Kapat" onPress={() => setViewerMessage(null)} />
                </View>
            </View>
        </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    list: { flex: 1 },
    centered: { flex: 1 },
    loadingText: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x3 },
    content: { flexGrow: 1, paddingVertical: spacing.x3 },
    headerSpacing: { height: spacing.x2 },
    olderSection: { alignItems: 'center', paddingHorizontal: spacing.x4, paddingBottom: spacing.x2 },
    olderError: { ...typography.supporting, color: colors.errorDark, textAlign: 'center', marginBottom: spacing.x1 },
    activityError: { ...typography.caption, color: colors.warningDark, textAlign: 'center', paddingHorizontal: spacing.x4, paddingTop: spacing.x2 },
    emptyState: { flex: 1, justifyContent: 'center' },
    viewerBackdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: spacing.x4 },
    viewerContent: { maxHeight: '90%', gap: spacing.x3 },
    viewerImage: { width: '100%', aspectRatio: 1, maxHeight: 520 },
    viewerCaption: { ...typography.body, color: colors.white, textAlign: 'center' },
});
