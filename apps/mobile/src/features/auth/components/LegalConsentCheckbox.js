import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { openExternalLink } from '../../../shared/utils/externalLinking';

// Explicit consent row: the checkbox toggles acceptance, the document name
// opens the published text. Nothing is pre-checked.
export default function LegalConsentCheckbox({ checked, onToggle, documentLabel, documentUrl, suffix, disabled = false }) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={disabled ? undefined : onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked, disabled }}
        accessibilityLabel={`${documentLabel} ${suffix}`}
        hitSlop={8}
        style={({ pressed }) => [styles.box, checked && styles.boxChecked, pressed && !disabled && styles.pressed]}
      >
        {checked ? <Icon name="check" size={14} color={colors.textOnPrimary} /> : null}
      </Pressable>
      <Text style={styles.text}>
        <Text
          accessibilityRole="link"
          onPress={() => openExternalLink(documentUrl)}
          style={styles.link}
        >
          {documentLabel}
        </Text>
        {suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
  box: {
    width: 22,
    height: 22,
    marginTop: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { ...typography.supporting, color: colors.textSecondary, flex: 1 },
  link: { color: colors.primaryDark, fontFamily: typography.button.fontFamily },
  pressed: { opacity: 0.6 },
});
