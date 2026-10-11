import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { KVKK_URL } from '../../utils/externalLinkPolicy.cjs';
import { openExternalLink } from '../../utils/externalLinking';

// Informational notice only: this does not collect consent or establish a processing basis.
export default function HealthDataNotice() {
  return (
    <View style={styles.root}>
      <Text style={styles.text}>
        Kaydettiğin sağlık ve beslenme bilgileri hesabında saklanır. Diyetisyenlere ancak
        aktif ve yetkili bir bağlantı kapsamında gösterilir. Platform bu bilgilerden
        bağımsız teşhis veya tedavi önerisi üretmez.
      </Text>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="KVKK Aydınlatma Metni'ni görüntüle"
        onPress={() => openExternalLink(KVKK_URL)}
        style={styles.link}
      >
        <Text style={styles.linkText}>KVKK Aydınlatma Metni</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.x1,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.x3,
    backgroundColor: colors.surface,
  },
  text: { ...typography.supporting, color: colors.textSecondary },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { ...typography.supporting, color: colors.primaryDark, fontFamily: typography.button.fontFamily },
});
