import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { EmptyState, ErrorState } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import ChatComposer from '../../chat/components/ChatComposer';
import ChatMessageList from '../../chat/components/ChatMessageList';
import { useChatViewModel } from '../../chat/viewmodels/useChatViewModel';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { CONNECTION_REQUIRED_MESSAGE } from '../../dietitianConnection/services/dietitianConnectionService';
import { resolveDietitianAvatarPresentation } from '../../chat/utils/chatUiUtils';
import { isChatImagesFeatureEnabled } from '../../chat/utils/chatImageFeatureFlag';
import { CHAT_SCREEN_CONTENT, resolveChatScreenContent } from '../../chat/utils/chatScreenContent';

function DietitianHeader({ activeConnection, activeDietitian }) {
  const dietitian = activeConnection?.dietitian || activeDietitian || {};
  const displayName = dietitian.fullName || dietitian.name || 'Diyetisyen';
  const [imageFailed, setImageFailed] = useState(false);
  const avatar = resolveDietitianAvatarPresentation({
    displayName,
    avatarUrl: dietitian.avatarUrl,
    imageFailed,
  });

  useEffect(() => setImageFailed(false), [dietitian.avatarUrl]);

  return (
    <View style={styles.header}>
      {avatar.avatarUrl ? (
        <Image
          source={{ uri: avatar.avatarUrl }}
          style={styles.avatar}
          onError={() => setImageFailed(true)}
          accessibilityLabel={`${displayName} profil fotoğrafı`}
        />
      ) : (
        <View accessible style={styles.avatarFallback} accessibilityLabel={`${displayName} profil fotoğrafı bulunamadı`}>
          <Text style={styles.avatarInitials}>{avatar.initials}</Text>
        </View>
      )}
      <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>{displayName}</Text>
    </View>
  );
}

function ActiveChatContent({ activeConnection, activeDietitian, isScreenFocused }) {
  // activeConnection comes from DietitianConnectionContext, which resolves it
  // for the already-authenticated client. clientId is used only for local
  // isOwn normalisation; it is never sent as an RPC parameter.
  const viewModel = useChatViewModel({
    currentUserId: activeConnection?.clientId,
    activeConnection,
    isScreenFocused,
  });
  // There is no native navigation header and the tab bar hides while the
  // keyboard is open. The in-screen header participates in this flex tree,
  // so the correct external offset is zero. Android uses Expo's resize mode.
  const keyboardAvoidingBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  const confirmDeleteMessage = useCallback((message) => {
    Alert.alert(
      'Mesajı sil',
      'Bu mesaj herkes için silinsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Mesajı sil',
          style: 'destructive',
          onPress: async () => {
            const result = await viewModel.removeMessage(message);
            if (!result?.ok && !result?.busy && !result?.stale) {
              Alert.alert('Mesaj silinemedi', result?.message || 'Mesaj şu anda silinemedi. Lütfen tekrar deneyin.');
            }
          },
        },
      ],
    );
  }, [viewModel.removeMessage]);

  return (
    <KeyboardAvoidingView
      style={styles.chatRoot}
      behavior={keyboardAvoidingBehavior}
      keyboardVerticalOffset={0}
    >
      <DietitianHeader activeConnection={activeConnection} activeDietitian={activeDietitian} />
      <View style={styles.listArea}>
        <ChatMessageList
          messages={viewModel.timelineMessages}
          mealActivityError={viewModel.mealActivityError}
          isInitialLoading={viewModel.isInitialLoading}
          initialError={viewModel.initialError}
          onRetryInitial={viewModel.retryInitialLoad}
          nextCursor={viewModel.nextCursor}
          isLoadingOlder={viewModel.isLoadingOlder}
          loadOlderError={viewModel.loadOlderError}
          onLoadOlder={viewModel.loadOlderMessages}
          onRetryOlder={viewModel.loadOlderMessages}
          onRetryMessage={viewModel.retryMessage}
          onRequestDeleteMessage={confirmDeleteMessage}
          deletingMessageIds={viewModel.deletingMessageIds}
          peerReadState={viewModel.peerReadState}
          initialPositionToken={viewModel.initialPositionToken}
          bottomScrollToken={viewModel.bottomScrollToken}
          realtimeScrollToken={viewModel.realtimeScrollToken}
          conversationId={viewModel.conversation?.id ?? null}
          onLastVisibleCanonicalMessageChange={viewModel.handleVisibleCanonicalMessageChange}
          imageStates={viewModel.imageStates}
          onRetryImage={viewModel.retryImage}
        />
      </View>
      <ChatComposer
        draft={viewModel.draft}
        onChangeDraft={viewModel.setDraft}
        onSubmit={viewModel.sendDraft}
        disabled={!viewModel.canSend}
        isSending={viewModel.isSending}
        sendError={viewModel.sendError}
        featureEnabled={isChatImagesFeatureEnabled()}
        conversationId={viewModel.conversation?.id ?? null}
        imageUpload={viewModel.imageUpload}
      />
    </KeyboardAvoidingView>
  );
}

export default function ChatScreen() {
  const isScreenFocused = useIsFocused();
  const {
    activeConnection,
    activeDietitian,
    hasActiveDietitian,
    isLoadingConnection,
    connectionError,
    refreshConnectionStatus,
  } = useDietitianConnection();

  let content;

  // Once an active connection is resolved, a background refresh (for example
  // the AppState -> active transition after returning from the system image
  // picker) must not swap the chat for a full-screen loader. Doing so would
  // unmount ActiveChatContent and discard the picked image draft before the
  // user reaches the preview/caption step.
  const screenContent = resolveChatScreenContent({
    isLoadingConnection,
    connectionError,
    hasActiveDietitian,
    activeConnection,
  });

  if (screenContent === CHAT_SCREEN_CONTENT.LOADING) {
    content = (
      <View
        style={styles.loading}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Diyetisyen bağlantısı kontrol ediliyor"
        accessibilityState={{ busy: true }}
        accessibilityLiveRegion="polite"
      >
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={styles.loadingText}>Diyetisyen bağlantısı kontrol ediliyor…</Text>
      </View>
    );
  } else if (screenContent === CHAT_SCREEN_CONTENT.ERROR) {
    content = (
      <ErrorState
        title="Diyetisyen bağlantısı kontrol edilemedi"
        description="Bağlantı durumunu şu anda alamıyoruz. Lütfen tekrar deneyin."
        onRetry={refreshConnectionStatus}
      />
    );
  } else if (screenContent === CHAT_SCREEN_CONTENT.LOCKED) {
    content = (
      <EmptyState
        icon="lock"
        title="Sohbet kilitli"
        description={CONNECTION_REQUIRED_MESSAGE}
      />
    );
  } else {
    content = (
      <ActiveChatContent
        activeConnection={activeConnection}
        activeDietitian={activeDietitian}
        isScreenFocused={isScreenFocused}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  chatRoot: { flex: 1 },
  listArea: { flex: 1 },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.x3,
    paddingHorizontal: spacing.x4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted },
  avatarFallback: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  avatarInitials: { ...typography.supporting, color: colors.primaryDark, fontWeight: '700' },
  headerTitle: { ...typography.cardTitle, flex: 1, color: colors.textPrimary },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.x4, paddingHorizontal: spacing.x6 },
  loadingText: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center' },
});
