import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppButton, AppCard, AppInput, InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { useInviteFlow } from '../context/InviteFlowContext';
import { useDietitianConnection } from '../context/DietitianConnectionContext';
import { formatInviteCodeInput } from '../utils/inviteCodeContract.cjs';

export default function InviteConnectionCard() {
    const { hasActiveDietitian, isLoadingConnection, connectionError } = useDietitianConnection();
    const { openInvite, error } = useInviteFlow();
    const [code, setCode] = useState('');
    if (hasActiveDietitian || isLoadingConnection || connectionError) return null;
    return (
        <AppCard contentStyle={styles.content}>
            <Text style={styles.title}>Diyetisyeninize bağlanın</Text>
            <AppInput label="Diyetisyen kodu" placeholder="ABCD-2345" hint="Harf ve rakamları girin; büyük harf ve çizgi otomatik düzenlenir." value={code} onChangeText={(value) => setCode(formatInviteCodeInput(value))} autoCapitalize="characters" autoCorrect={false} maxLength={64} />
            {error ? <InlineAlert variant="error" message={error} /> : null}
            <AppButton label="Devam" disabled={!code.trim()} onPress={() => openInvite(code)} />
            <Text style={styles.text}>Kodunuz yok mu? Diyetisyeninizden isteyin.</Text>
        </AppCard>
    );
}
const styles = StyleSheet.create({
    content: { gap: spacing.x3 }, title: { ...typography.sectionTitle, color: colors.textPrimary },
    text: { ...typography.supporting, color: colors.textSecondary },
});
