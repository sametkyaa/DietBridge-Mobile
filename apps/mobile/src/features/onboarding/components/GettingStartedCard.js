import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, ProgressBar } from '../../../shared/components/ui';
import { colors, radius, shadows, spacing, typography } from '../../../shared/theme';

function ChecklistRow({ item, onPress, busy, isFirst }) {
    const interactive = !item.done && !!onPress;
    const content = (
        <>
            <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>
                {item.done ? <Icon name="check" size={13} color={colors.textOnPrimary} /> : null}
            </View>
            <View style={styles.rowText}>
                <Text style={[styles.rowLabel, item.done && styles.rowLabelDone]}>{item.label}</Text>
                {!item.done && item.hint ? <Text style={styles.rowHint}>{item.hint}</Text> : null}
            </View>
            {busy ? <ActivityIndicator size="small" color={colors.primaryDark} /> : null}
            {!busy && interactive ? <Icon name="chevronRight" size={20} color={colors.textTertiary} /> : null}
        </>
    );

    if (!interactive) {
        return (
            <View style={[styles.row, !isFirst && styles.rowDivider]} accessible accessibilityLabel={`${item.label}${item.done ? ', tamamlandı' : ''}`}>
                {content}
            </View>
        );
    }
    return (
        <Pressable
            onPress={busy ? undefined : onPress}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [styles.row, !isFirst && styles.rowDivider, pressed && styles.pressed]}
        >
            {content}
        </Pressable>
    );
}

function GettingStartedCard({ items, completedCount, totalCount, actions = {}, busyKey = null, onDismiss }) {
    return (
        <View style={styles.root}>
            <View style={styles.hero}>
                <View style={styles.heroRow}>
                    <View style={styles.heroText}>
                        <Text style={styles.heroTitle}>Başlangıç</Text>
                        <Text style={styles.heroSubtitle}>İlk gününü birkaç adımda hazırla</Text>
                    </View>
                    <Text style={styles.heroCount}>{completedCount} / {totalCount}</Text>
                    <Pressable onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Başlangıç kartını gizle" style={styles.dismiss}>
                        <Icon name="close" size={18} color={colors.textOnPrimary} />
                    </Pressable>
                </View>
                <ProgressBar
                    value={(completedCount / Math.max(totalCount, 1)) * 100}
                    tone="accent"
                    style={styles.heroTrack}
                    accessibilityLabel={`${totalCount} adımdan ${completedCount} tanesi tamamlandı`}
                />
            </View>
            <View style={styles.list}>
                {items.map((item, index) => (
                    <ChecklistRow key={item.key} item={item} isFirst={index === 0} onPress={actions[item.key]} busy={busyKey === item.key} />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.surface, ...shadows.card },
    hero: { backgroundColor: colors.primaryDark, padding: spacing.x5, gap: spacing.x3 },
    heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    heroText: { flex: 1, minWidth: 0 },
    heroTitle: { ...typography.cardTitle, color: colors.textOnPrimary },
    heroSubtitle: { ...typography.supporting, color: colors.primarySoft },
    heroCount: { ...typography.numericSmall, color: colors.accent },
    dismiss: { width: 32, height: 32, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(244, 247, 242, 0.12)' },
    heroTrack: { backgroundColor: 'rgba(244, 247, 242, 0.18)' },
    list: { paddingHorizontal: spacing.x5, paddingVertical: spacing.x2 },
    row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, paddingVertical: spacing.x3 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong },
    pressed: { opacity: 0.7 },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: radius.round,
        borderWidth: 1.5,
        borderColor: colors.borderStrong,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
    rowText: { flex: 1, minWidth: 0 },
    rowLabel: { ...typography.bodyMedium, color: colors.textPrimary },
    rowLabelDone: { color: colors.textTertiary, textDecorationLine: 'line-through' },
    rowHint: { ...typography.supporting, color: colors.textSecondary },
});

export default GettingStartedCard;
