import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import AppButton from './AppButton';
import Icon from './Icon';

export function ErrorState({ title, description, onRetry, retryLabel = 'Tekrar dene', style }) {
  return (
    <View style={[styles.root, style]} accessibilityLiveRegion="polite">
      <View style={styles.iconWrap} accessible={false} importantForAccessibility="no">
        <Icon name="alert" size={26} color={colors.error} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {onRetry ? (
        <AppButton
          label={retryLabel}
          onPress={onRetry}
          accessibilityLabel={retryLabel}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.x6,
    gap: spacing.x2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.errorSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x2,
  },
  title: { ...typography.cardTitle, color: colors.textPrimary, textAlign: 'center' },
  description: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center' },
  action: { marginTop: spacing.x3, alignSelf: 'stretch' },
});

export default ErrorState;
