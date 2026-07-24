import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Icon } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

export function WeightCard({ weight, value, onChange, onSave, isSaving }) {
    return (
        <AppCard>
            <View style={styles.titleRow}>
                <Icon name="target" size={20} color={colors.primaryDark} />
                <View style={styles.titleText}>
                    <Text style={styles.title}>Güncel kilonuz</Text>
                    <Text style={styles.supporting}>
                        {weight ? `Son kaydedilen: ${weight} kg` : 'Henüz kilonuzu girmediniz.'}
                    </Text>
                </View>
            </View>
            <View style={styles.controls}>
                <AppInput
                    value={value}
                    onChangeText={onChange}
                    keyboardType="decimal-pad"
                    maxLength={5}
                    placeholder="0,0"
                    accessibilityLabel="Güncel kilo, kilogram"
                    editable={!isSaving}
                    style={styles.input}
                />
                <AppButton label="Kaydet" onPress={onSave} loading={isSaving} style={styles.button} />
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2 },
    titleText: { flex: 1 },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    controls: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x2, marginTop: spacing.x4 },
    input: { flex: 1 },
    button: { minWidth: 104 },
});

export default WeightCard;
