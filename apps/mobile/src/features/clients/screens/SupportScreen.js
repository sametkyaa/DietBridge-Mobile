import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
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
        <Text style={styles.description}>
          Sorularınız veya geri bildirimleriniz için bize e-posta gönderebilirsiniz.
        </Text>
        <AppCard contentStyle={styles.card}>
          <View style={styles.iconWrap}>
            <Icon name="message" size={22} color={colors.primaryDark} />
          </View>
          <Text style={styles.emailLabel}>Destek e-postası</Text>
          <Text selectable style={styles.email}>{SUPPORT_EMAIL}</Text>
          <AppButton
            label="E-posta Gönder"
            onPress={openSupportEmail}
            accessibilityLabel="Destek e-postası gönder"
            style={styles.button}
          />
        </AppCard>
        <LegalLinks includeKvkk />
      </View>
    </InfoPlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.x6 },
  description: { ...typography.body, color: colors.textSecondary },
  card: { alignItems: 'flex-start', gap: spacing.x1 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.x3,
  },
  emailLabel: { ...typography.caption, color: colors.textSecondary },
  email: { ...typography.cardTitle, color: colors.textPrimary },
  button: { alignSelf: 'stretch', marginTop: spacing.x4 },
});
