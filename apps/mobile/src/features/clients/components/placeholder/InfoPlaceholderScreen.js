import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreen, EmptyState, Icon } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

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
        header={(
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Geri"
              hitSlop={4}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Icon name="back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text accessibilityRole="header" style={styles.headerTitle}>{title}</Text>
            <View style={styles.headerBalance} accessible={false} />
          </View>
        )}
        contentStyle={styles.content}
      >
        {children || <EmptyState icon={icon} title={emptyTitle} description={description} />}
      </AppScreen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.x3,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
  headerBalance: { width: 44, height: 44 },
  content: { flexGrow: 1, justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
