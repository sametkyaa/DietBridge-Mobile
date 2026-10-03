import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Icon, InlineAlert, ProgressBar } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const GLASS_LITERS = 0.25;
const MAX_GLASSES = 12;
const formatLiters = (value) => (Number.isFinite(value) ? value : 0).toFixed(2).replace('.', ',');

function GlassRow({ water, target }) {
    const count = Math.max(1, Math.min(MAX_GLASSES, Math.round(target / GLASS_LITERS)));
    const filled = Math.min(count, Math.floor((water + 0.0001) / GLASS_LITERS));
    return (
        <View style={styles.glasses} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            {Array.from({ length: count }, (_, index) => (
                <View key={index} style={[styles.glass, index < filled && styles.glassFilled]} />
            ))}
        </View>
    );
}

export function WaterTrackerCard({
    water,
    target,
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
    const disabled = isAdding || isUndoing || status === 'loading' || status === 'retrying' || status === 'error';

    return (
        <AppCard>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Icon name="droplet" size={18} color={colors.tealDark} />
                    <Text style={styles.title} accessibilityRole="header">Su</Text>
                </View>
                <Text style={styles.amount}>
                    {formatLiters(water)}
                    <Text style={styles.target}>{Number.isFinite(target) ? ` / ${formatLiters(target)} L` : ' L'}</Text>
                </Text>
            </View>
            {status === 'loading' || status === 'retrying' ? (
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
                    {Number.isFinite(target) && target > 0 ? (
                        <View accessible accessibilityRole="progressbar" accessibilityLabel="Günlük su hedefi" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
                            <GlassRow water={water} target={target} />
                        </View>
                    ) : (
                        <ProgressBar value={progress * 100} tone="teal" accessibilityLabel="Günlük su hedefi" />
                    )}
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
                    onPress={disabled ? undefined : () => onRemove()}
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
                    rightAccessory={<Text style={styles.unit}>ml</Text>}
                />
                <Pressable
                    onPress={disabled ? undefined : () => onAdd()}
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.x4 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    title: { ...typography.sectionTitle, color: colors.textPrimary },
    amount: { ...typography.numericSmall, color: colors.textPrimary },
    target: { ...typography.supporting, fontVariant: ['tabular-nums'], color: colors.textTertiary },
    glasses: { flexDirection: 'row', gap: 6 },
    glass: { flex: 1, height: 34, borderRadius: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.tealSoft },
    glassFilled: { backgroundColor: colors.teal },
    stateRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    supporting: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x2 },
    errorWrap: { marginTop: spacing.x2 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2, marginTop: spacing.x4 },
    roundButton: { width: 48, height: 48, borderRadius: radius.round, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center' },
    inputRoot: { flex: 1 },
    input: { textAlign: 'center', paddingVertical: spacing.x2, fontVariant: ['tabular-nums'] },
    unit: { ...typography.supporting, color: colors.textSecondary, marginLeft: spacing.x2 },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.8 },
});

export default WaterTrackerCard;
