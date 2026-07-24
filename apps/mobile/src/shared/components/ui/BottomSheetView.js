import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export function BottomSheetView({
  visible,
  onClose,
  title,
  children,
  footer,
  contentStyle,
  maxHeight,
  bottomInset = 0,
  keyboardVerticalOffset = 0,
  scrollable = false,
  keyboardAvoiding = true,
}) {
  const { height: windowHeight } = useWindowDimensions();
  const safeInsets = useSafeAreaInsets();
  const resolvedMaxHeight = maxHeight ?? Math.round(windowHeight * 0.9);

  const body = scrollable ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={keyboardAvoiding}
        style={styles.flex}
      >
        <View style={styles.overlay} accessibilityViewIsModal>
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          />
          <View
            style={[
              styles.sheet,
              {
                maxHeight: resolvedMaxHeight,
                paddingBottom: spacing.x6 + bottomInset,
                paddingLeft: spacing.x5 + safeInsets.left,
                paddingRight: spacing.x5 + safeInsets.right,
              },
            ]}
          >
            <View style={styles.handle} accessible={false} importantForAccessibility="no" />
            {title ? <Text style={styles.title} accessibilityRole="header">{title}</Text> : null}
            {body}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 40, 32, 0.4)',
    justifyContent: 'flex-end',
  },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.x5,
    paddingTop: spacing.x3,
    flexShrink: 1,
    ...shadows.sheet,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
    marginBottom: spacing.x4,
  },
  title: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.x3 },
  scroll: { flexShrink: 1 },
  content: { gap: spacing.x3 },
  footer: { marginTop: spacing.x4, gap: spacing.x2 },
});

export default BottomSheetView;
