import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from '../../../shared/hooks/useReducedMotion';
import { animateNextLayout } from '../../../shared/utils/layoutMotion';
import {
    AppCard,
    AppInput,
    AppScreen,
    EmptyState,
    ErrorState,
    Icon,
    InlineAlert,
    ProgressBar,
    ScreenHeader,
} from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useGroceryListViewModel } from '../viewmodels/useGroceryListViewModel';

function GroceryItem({ item, pending, onToggle, onDelete, isLast }) {
    const completionLabel = item.isCompleted
        ? `${item.name}, tamamlandı. Tekrar aktif yapmak için dokunun.`
        : `${item.name}, aktif. Tamamlandı olarak işaretlemek için dokunun.`;

    return (
        <View style={[styles.itemRow, !isLast && styles.itemDivider]}>
            <Pressable
                onPress={pending ? undefined : onToggle}
                disabled={pending}
                accessibilityRole="checkbox"
                accessibilityLabel={completionLabel}
                accessibilityState={{ checked: item.isCompleted, disabled: pending, busy: pending }}
                style={({ pressed }) => [styles.checkButton, pending && styles.disabled, pressed && !pending && styles.pressed]}
            >
                <View style={[styles.checkbox, item.isCompleted && styles.checkboxCompleted]}>
                    {item.isCompleted ? <Icon name="check" size={15} color={colors.primaryDark} /> : null}
                </View>
                <Text style={[styles.itemName, item.isCompleted && styles.itemNameCompleted]}>{item.name}</Text>
            </Pressable>
            <Pressable
                onPress={pending ? undefined : onDelete}
                disabled={pending}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} ürününü sil`}
                accessibilityState={{ disabled: pending, busy: pending }}
                hitSlop={6}
                style={({ pressed }) => [styles.deleteButton, pending && styles.disabled, pressed && !pending && styles.pressed]}
            >
                {pending ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Icon name="close" size={18} color={colors.textTertiary} />}
            </Pressable>
        </View>
    );
}

function GroceryGroup({ title, items, pendingItemIds, onToggle, onDelete }) {
    if (items.length === 0) return null;
    return (
        <View>
            <Text style={styles.groupTitle}>{title}</Text>
            <AppCard style={styles.groupCard}>
                {items.map((item, index) => (
                    <GroceryItem
                        key={item.id}
                        item={item}
                        pending={!!pendingItemIds[item.id]}
                        onToggle={() => onToggle(item)}
                        onDelete={() => onDelete(item)}
                        isLast={index === items.length - 1}
                    />
                ))}
            </AppCard>
        </View>
    );
}

export default function GroceryListScreen({ navigation }) {
    const {
        items,
        activeItems,
        completedItems,
        status,
        error,
        mutationError,
        input,
        setInput,
        inputError,
        isAdding,
        pendingItemIds,
        retryItems,
        addItem,
        toggleItem,
        deleteItem,
    } = useGroceryListViewModel();
    const isLoading = status === 'loading' || status === 'retrying';
    const canMutate = status === 'ready' || status === 'empty';
    const reducedMotion = useReducedMotion();
    const handleToggle = (item) => {
        animateNextLayout({ reduced: reducedMotion });
        void toggleItem(item.id);
    };

    const confirmDelete = (item) => {
        if (pendingItemIds[item.id]) return;
        Alert.alert(
            'Ürünü sil',
            'Bu ürünü listeden silmek istiyor musunuz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        animateNextLayout({ reduced: reducedMotion });
                        void deleteItem(item.id);
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <AppScreen
                scroll
                header={(
                    <ScreenHeader
                        title="Alışveriş listesi"
                        subtitle="İhtiyacın olanları ekle, aldıkça işaretle."
                        onBack={() => navigation.goBack()}
                    />
                )}
                contentStyle={styles.content}
            >
            <View style={styles.addRow}>
                <AppInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Ürün ekle, örneğin süt"
                    error={inputError}
                    maxLength={120}
                    editable={!isAdding && canMutate}
                    accessibilityLabel="Ürün adı"
                    returnKeyType="done"
                    onSubmitEditing={() => { void addItem(); }}
                    style={styles.addInput}
                />
                <Pressable
                    onPress={isAdding || !canMutate ? undefined : () => { void addItem(); }}
                    disabled={isAdding || !canMutate}
                    accessibilityRole="button"
                    accessibilityLabel="Alışveriş listesine ürün ekle"
                    accessibilityState={{ disabled: isAdding || !canMutate, busy: isAdding }}
                    style={({ pressed }) => [styles.addButton, !canMutate && styles.disabled, pressed && styles.pressed]}
                >
                    {isAdding
                        ? <ActivityIndicator size="small" color={colors.textOnPrimary} />
                        : <Icon name="plus" size={22} color={colors.textOnPrimary} />}
                </Pressable>
            </View>

            {items.length > 0 && !isLoading && status !== 'error' ? (
                <View style={styles.progress}>
                    <View style={styles.progressText}>
                        <Text style={styles.progressCount}>{completedItems.length}/{items.length}</Text>
                        <Text style={styles.progressLabel}>ürün alındı</Text>
                    </View>
                    <ProgressBar
                        value={(completedItems.length / items.length) * 100}
                        accessibilityLabel="Alışveriş ilerlemesi"
                    />
                </View>
            ) : null}

            {mutationError ? <InlineAlert variant="error" title="İşlem tamamlanamadı" message={mutationError} /> : null}

            {isLoading ? (
                <View
                    style={styles.loading}
                    accessible
                    accessibilityRole="progressbar"
                    accessibilityLabel={status === 'retrying' ? 'Alışveriş listesi yeniden yükleniyor' : 'Alışveriş listesi yükleniyor'}
                    accessibilityState={{ busy: true }}
                >
                    <ActivityIndicator size="small" color={colors.primaryDark} />
                    <Text style={styles.stateText}>{status === 'retrying' ? 'Liste yeniden yükleniyor...' : 'Liste yükleniyor...'}</Text>
                </View>
            ) : null}

            {status === 'error' ? (
                <AppCard>
                    <ErrorState
                        title="Alışveriş listesi yüklenemedi"
                        description={error}
                        onRetry={retryItems}
                    />
                </AppCard>
            ) : null}

            {!isLoading && status !== 'error' && items.length === 0 ? (
                <AppCard>
                    <EmptyState
                        icon="cart"
                        title="Listeniz boş"
                        description="İhtiyacınız olan ilk ürünü yukarıdaki alandan ekleyin."
                    />
                </AppCard>
            ) : null}

            {!isLoading && status !== 'error' && items.length > 0 ? (
                <View style={styles.list}>
                    <GroceryGroup
                        title="Alınacaklar"
                        items={activeItems}
                        pendingItemIds={pendingItemIds}
                        onToggle={handleToggle}
                        onDelete={confirmDelete}
                    />
                    <GroceryGroup
                        title="Sepette"
                        items={completedItems}
                        pendingItemIds={pendingItemIds}
                        onToggle={handleToggle}
                        onDelete={confirmDelete}
                    />
                </View>
            ) : null}
            </AppScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.x8, gap: spacing.x5 },
    addRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x2 },
    addInput: { flex: 1 },
    addButton: {
        width: 52,
        height: 52,
        borderRadius: radius.round,
        backgroundColor: colors.primaryDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progress: { gap: spacing.x2 },
    progressText: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.x2 },
    progressCount: { ...typography.numericSmall, color: colors.textPrimary },
    progressLabel: { ...typography.supporting, color: colors.textSecondary },
    loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x8, gap: spacing.x2 },
    stateText: { ...typography.supporting, color: colors.textSecondary },
    list: { gap: spacing.x6 },
    groupTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: spacing.x3 },
    groupCard: { paddingVertical: spacing.x1 },
    itemRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center' },
    itemDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
    checkButton: { flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    checkbox: { width: 24, height: 24, borderRadius: radius.round, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    checkboxCompleted: { backgroundColor: colors.accent, borderColor: colors.accent },
    itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
    itemNameCompleted: { color: colors.textTertiary, textDecorationLine: 'line-through' },
    deleteButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.75 },
});
