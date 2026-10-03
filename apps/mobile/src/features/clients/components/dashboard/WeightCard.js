import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput } from '../../../../shared/components/ui';
import { CountUp } from '../../../../shared/components/motion';
import { colors, spacing, typography } from '../../../../shared/theme';

const formatWeight = (weight) => String(weight).replace('.', ',');

export function WeightCard({ weight, value, onChange, onSave, isSaving }) {
    return (
        <AppCard>
            <View style={styles.header}>
                <Text style={styles.title} accessibilityRole="header">Kilo</Text>
                {weight ? (
                    <Text style={styles.current}>
                        <CountUp
                            value={Number(String(weight).replace(',', '.'))}
                            format={(n) => (n === Number(String(weight).replace(',', '.')) ? formatWeight(weight) : formatWeight(Math.round(n * 10) / 10))}
                        />
                        <Text style={styles.unit}> kg</Text>
                    </Text>
                ) : null}
            </View>
            <Text style={styles.supporting}>
                {weight ? 'Son kaydın. Bugün tartıldıysan yeni değeri gir.' : 'Henüz kilonu girmedin. İlk ölçümünü ekle.'}
            </Text>
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
                    rightAccessory={<Text style={styles.inputUnit}>kg</Text>}
                />
                <AppButton variant="secondary" label="Kaydet" onPress={onSave} loading={isSaving} style={styles.button} />
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.x2 },
    title: { ...typography.sectionTitle, color: colors.textPrimary },
    current: { ...typography.numericSmall, color: colors.textPrimary },
    unit: { ...typography.supporting, color: colors.textTertiary },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x1 },
    controls: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.x2, marginTop: spacing.x4 },
    input: { flex: 1 },
    inputUnit: { ...typography.supporting, color: colors.textTertiary },
    button: { minWidth: 104 },
});

export default WeightCard;
