import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Icon, InlineAlert, ProgressBar } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

export function WaterTrackerCard({
    water,
    waterInput,
    onWaterInputChange,
    progress,
    status,
    error,
    isAdding,
    isUndoing,
    onAdd,
    onRemove,
    onRetry,
}) {
    const disabled = isAdding || isUndoing || status === 'loading' || status === 'error';

    return (
        <AppCard>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Icon name="droplet" size={20} color={colors.tealDark} />
                    <Text style={styles.title} accessibilityRole="header">Su takibi</Text>
                </View>
                <Text style={styles.amount}>{water.toFixed(2)} L</Text>
            </View>
            {status === 'loading' ? (
                <View
                    style={styles.stateRow}
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel="Günlük su kaydı yükleniyor"
                    accessibilityState={{ busy: true }}
                    accessibilityLiveRegion="polite"
                >
                    <ActivityIndicator size="small" color={colors.tealDark} />
                    <Text style={styles.supporting}>Günlük kayıt yükleniyor...</Text>
                </View>
            ) : (
                <>
                    <ProgressBar value={progress * 100} tone="teal" accessibilityLabel="Günlük su hedefi" />
                    {status === 'empty' ? <Text style={styles.supporting}>Bugün için henüz su kaydı yok.</Text> : null}
                    {status === 'error' ? (
                        <View style={styles.errorWrap}>
                            <InlineAlert variant="error" title="Su kaydı yüklenemedi" message={error} />
                            <AppButton variant="text" label="Tekrar dene" onPress={onRetry} />
                        </View>
                    ) : null}
                </>
            )}
            <View style={styles.controls}>
                <Pressable
                    onPress={disabled ? undefined : onRemove}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel="Su miktarını azalt"
                    accessibilityState={{ disabled, busy: isUndoing }}
                    style={({ pressed }) => [styles.roundButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
                >
                    {isUndoing ? <ActivityIndicator color={colors.tealDark} /> : <Icon name="minus" color={colors.tealDark} />}
                </Pressable>
                <AppInput
                    value={waterInput}
                    onChangeText={onWaterInputChange}
                    keyboardType="number-pad"
                    maxLength={4}
                    accessibilityLabel="Su miktarı, mililitre"
                    style={styles.inputRoot}
                    inputStyle={styles.input}
                    editable={!disabled}
                />
                <Text style={styles.unit}>ml</Text>
                <Pressable
                    onPress={disabled ? undefined : onAdd}
                    disabled={disabled}
                    accessibilityRole="button"
                    accessibilityLabel="Su miktarı ekle"
                    accessibilityState={{ disabled, busy: isAdding }}
                    style={({ pressed }) => [styles.roundButton, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
                >
                    {isAdding ? <ActivityIndicator color={colors.tealDark} /> : <Icon name="plus" color={colors.tealDark} />}
                </Pressable>
            </View>
        </AppCard>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.x3 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    title: { ...typography.bodyMedium, color: colors.textPrimary },
    amount: { ...typography.cardTitle, color: colors.textPrimary },
    stateRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
    errorWrap: { marginTop: spacing.x2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2, marginTop: spacing.x4 },
    roundButton: { width: 44, height: 44, borderRadius: radius.round, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
    inputRoot: { flex: 1 },
    input: { textAlign: 'center', paddingVertical: spacing.x2 },
    unit: { ...typography.supporting, color: colors.textSecondary, marginLeft: -spacing.x5 },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.8 },
});

export default WaterTrackerCard;
