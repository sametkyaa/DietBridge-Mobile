import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppScreen } from '../../../shared/components/ui';
import { colors, spacing } from '../../../shared/theme';

export default function AuthShell({ children, contentStyle }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <AppScreen
          scroll
          backgroundColor={colors.background}
          contentStyle={[styles.content, contentStyle]}
        >
          {children}
        </AppScreen>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: spacing.x5,
    paddingBottom: spacing.x6,
  },
});
