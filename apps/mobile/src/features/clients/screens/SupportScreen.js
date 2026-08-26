import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { SUPPORT_EMAIL } from '../../../shared/utils/externalLinkPolicy.cjs';
import { openSupportEmail } from '../../../shared/utils/externalLinking';
import LegalLinks from '../../../shared/components/legal/LegalLinks';
import { InfoPlaceholderScreen } from '../components/placeholder';

export default function SupportScreen({ navigation }) {
  return (
    <InfoPlaceholderScreen
      navigation={navigation}
      title="Destek"
      icon="support"
    >
      <View style={styles.content}>
        <Text style={styles.title}>Yardım ve destek</Text>
        <Text style={styles.description}>
          Sorularınız veya geri bildirimleriniz için bize e-posta gönderebilirsiniz.
        </Text>
        <Text style={styles.emailLabel}>Destek e-postası</Text>
        <Text selectable style={styles.email}>{SUPPORT_EMAIL}</Text>
        <AppButton
          variant="secondary"
          label="E-posta Gönder"
          onPress={openSupportEmail}
          accessibilityLabel="Destek e-postası gönder"
        />
        <LegalLinks includeKvkk />
      </View>
    </InfoPlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.x3 },
  title: { ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
  description: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emailLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  email: { ...typography.bodyMedium, color: colors.primaryDark, textAlign: 'center' },
});
