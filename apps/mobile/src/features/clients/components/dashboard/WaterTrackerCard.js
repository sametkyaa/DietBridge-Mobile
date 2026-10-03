import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppCard, AppInput, Icon, InlineAlert, ProgressBar } from '../../../../shared/components/ui';
import { useReducedMotion } from '../../../../shared/hooks/useReducedMotion';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

const GLASS_LITERS = 0.25;
const GLASS_ML = 250;
const MAX_GLASSES = 12;
const formatLiters = (value) => (Number.isFinite(value) ? value : 0).toFixed(2).replace('.', ',');
const GLASS_HEIGHT = 34;

function Glass({ fill, reduced, disabled, onPress }) {
    const level = useRef(new Animated.Value(GLASS_HEIGHT * (1 - fill))).current;

    useEffect(() => {
        const toValue = GLASS_HEIGHT * (1 - fill);
        if (reduced) {
            level.setValue(toValue);
            return undefined;
        }
        const animation = Animated.timing(level, {
            toValue,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        });
        animation.start();
        return () => animation.stop();
    }, [fill, level, reduced]);

    return (
        <Pressable
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
            hitSlop={{ top: 6, bottom: 6 }}
            style={({ pressed }) => [styles.glass, pressed && !disabled && styles.glassPressed]}
        >
            <Animated.View style={[styles.glassFill, { transform: [{ translateY: level }] }]} />
        </Pressable>
    );
}

// Each glass shows its own share of the logged water, so 0,20 L fills most of the first glass.
function GlassRow({ water, target, disabled, onAddGlass }) {
    const count = Math.max(1, Math.min(MAX_GLASSES, Math.round(target / GLASS_LITERS)));
    const glassesDrunk = Math.max(0, (Number.isFinite(water) ? water : 0) / GLASS_LITERS);
    const reduced = useReducedMotion();
    return (
        <View style={styles.glasses}>
            {Array.from({ length: count }, (_, index) => (
                <Glass
                    key={index}
                    fill={Math.min(1, Math.max(0, glassesDrunk - index))}
                    reduced={reduced}
                    disabled={disabled}
                    onPress={onAddGlass}
                />
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
                        <View>
                            <View
                                accessible
                                accessibilityRole="button"
                                accessibilityLabel="Bir bardak su ekle, 250 mililitre"
                                accessibilityHint={`Günlük hedefin yüzde ${Math.round(progress * 100)} kadarı tamamlandı`}
                                accessibilityState={{ disabled }}
                                accessibilityActions={[{ name: 'activate' }]}
                                onAccessibilityAction={(event) => {
                                    if (!disabled && event.nativeEvent.actionName === 'activate') onAdd(GLASS_ML);
                                }}
                            >
                                <GlassRow water={water} target={target} disabled={disabled} onAddGlass={() => onAdd(GLASS_ML)} />
                            </View>
                            <Text style={styles.glassHint}>Bardağa dokunarak 250 ml ekleyebilirsin.</Text>
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
    glass: { flex: 1, height: GLASS_HEIGHT, overflow: 'hidden', borderRadius: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, backgroundColor: colors.tealSoft },
    glassFill: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.teal },
    glassPressed: { opacity: 0.7 },
    glassHint: { ...typography.caption, color: colors.textTertiary, marginTop: spacing.x2 },
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
