import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreen, EmptyState, ScreenHeader } from '../../../../shared/components/ui';
import { colors, spacing } from '../../../../shared/theme';

export default function InfoPlaceholderScreen({
  navigation,
  title,
  icon,
  emptyTitle,
  description,
  children,
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppScreen
        scroll
        header={<ScreenHeader title={title} onBack={() => navigation.goBack()} />}
        contentStyle={children ? styles.content : styles.emptyContent}
      >
        {children || <EmptyState icon={icon} title={emptyTitle} description={description} />}
      </AppScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingBottom: spacing.x8 },
  emptyContent: { flexGrow: 1, justifyContent: 'center' },
});
