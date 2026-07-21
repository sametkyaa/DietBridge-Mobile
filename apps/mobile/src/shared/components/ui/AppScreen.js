import React from 'react';
import { Platform, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';

export function AppScreen({
  children,
  scroll = false,
  header = null,
  contentStyle,
  style,
  padTop = false,
  edges,
  backgroundColor = colors.background,
  refreshControl = null,
}) {
  const statusBarPadding = padTop && Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topInset = typeof edges?.top === 'number' ? edges.top : 0;
  const bottomInset = typeof edges?.bottom === 'number' ? edges.bottom : 0;

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: spacing.x6 + bottomInset },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, { paddingBottom: bottomInset }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        { backgroundColor, paddingTop: statusBarPadding + topInset },
        style,
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      {header}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.x5 },
});

export default AppScreen;
