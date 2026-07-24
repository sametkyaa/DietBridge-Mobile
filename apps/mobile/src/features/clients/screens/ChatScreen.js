import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreen, EmptyState, ErrorState } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { CONNECTION_REQUIRED_MESSAGE } from '../../dietitianConnection/services/dietitianConnectionService';

export default function ChatScreen() {
  const {
    hasActiveDietitian,
    isLoadingConnection,
    connectionError,
    refreshConnectionStatus,
  } = useDietitianConnection();

  let content;

  if (isLoadingConnection) {
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
  } else if (connectionError) {
    content = (
      <ErrorState
        title="Diyetisyen bağlantısı kontrol edilemedi"
        description="Bağlantı durumunu şu anda alamıyoruz. Lütfen tekrar deneyin."
        onRetry={refreshConnectionStatus}
      />
    );
  } else if (!hasActiveDietitian) {
    content = (
      <EmptyState
        icon="lock"
        title="Sohbet kilitli"
        description={CONNECTION_REQUIRED_MESSAGE}
      />
    );
  } else {
    content = (
      <EmptyState
        icon="message"
        title="Sohbet yakında"
        description="Mesajlaşma özelliği henüz kullanıma açılmadı."
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppScreen scroll contentStyle={styles.content}>
        {content}
      </AppScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingBottom: spacing.x6 },
  loading: { alignItems: 'center', gap: spacing.x4, paddingHorizontal: spacing.x6 },
  loadingText: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center' },
});
