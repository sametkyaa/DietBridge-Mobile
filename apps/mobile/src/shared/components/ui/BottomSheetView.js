import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
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
import { useModalTransition } from '../../hooks/useModalTransition';

const OPEN_SPRING = { damping: 22, stiffness: 220, mass: 1, overshootClamping: true };
const DRAG_CLOSE_DISTANCE = 120;
const DRAG_CLOSE_VELOCITY = 1.2;

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
  const { mounted, progress } = useModalTransition(visible, { duration: 280, spring: OPEN_SPRING });
  const drag = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible) drag.setValue(0);
  }, [drag, visible]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_, gesture) => drag.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > DRAG_CLOSE_DISTANCE || gesture.vy > DRAG_CLOSE_VELOCITY) {
        onCloseRef.current?.();
        return;
      }
      Animated.spring(drag, { toValue: 0, speed: 20, bounciness: 4, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(drag, { toValue: 0, speed: 20, bounciness: 4, useNativeDriver: true }).start();
    },
  }), [drag]);

  const translateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] }),
    drag,
  );

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
      visible={mounted}
      transparent
      animationType="none"
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
          <Animated.View pointerEvents="none" style={[styles.scrim, { opacity: progress }]} />
          <Pressable
            style={styles.backdrop}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Kapat"
          />
          <Animated.View
            style={[
              styles.sheet,
              { transform: [{ translateY }] },
              {
                maxHeight: resolvedMaxHeight,
                paddingBottom: spacing.x6 + bottomInset,
                paddingLeft: spacing.x5 + safeInsets.left,
                paddingRight: spacing.x5 + safeInsets.right,
              },
            ]}
          >
            <View {...panResponder.panHandlers}>
              <View style={styles.handle} accessible={false} importantForAccessibility="no" />
              {title ? <Text style={styles.title} accessibilityRole="header">{title}</Text> : null}
            </View>
            {body}
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 43, 38, 0.36)',
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
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.x5,
  },
  title: { ...typography.screenTitle, fontSize: 22, lineHeight: 28, color: colors.textPrimary, marginBottom: spacing.x4 },
  scroll: { flexShrink: 1 },
  content: { gap: spacing.x3 },
  footer: { marginTop: spacing.x4, gap: spacing.x2 },
});

export default BottomSheetView;
