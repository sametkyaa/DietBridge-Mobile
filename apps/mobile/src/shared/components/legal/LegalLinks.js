import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import {
  KVKK_URL,
  PRIVACY_URL,
  TERMS_URL,
} from '../../utils/externalLinkPolicy.cjs';
import { openExternalLink } from '../../utils/externalLinking';

function LegalLink({ label, target }) {
  return (
    <Pressable
      onPress={() => openExternalLink(target)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export default function LegalLinks({ includeKvkk = false }) {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>Yasal bilgiler</Text>
      <View style={styles.links}>
        <LegalLink label="Kullanım Koşulları" target={TERMS_URL} />
        <LegalLink label="Gizlilik Politikası" target={PRIVACY_URL} />
        {includeKvkk ? <LegalLink label="KVKK Aydınlatma Metni" target={KVKK_URL} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.x2 },
  label: { ...typography.caption, color: colors.textSecondary },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.x3, rowGap: spacing.x1 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { ...typography.supporting, color: colors.primaryDark, fontFamily: typography.button.fontFamily },
  pressed: { opacity: 0.6 },
});
