import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppInput, AppScreen, EmptyState, ErrorState, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { useGroceryListViewModel } from '../viewmodels/useGroceryListViewModel';

function ScreenHeader({ navigation }) {
    return (
        <View style={styles.header}>
            <Pressable
                onPress={() => navigation.goBack()}
                accessibilityRole="button"
                accessibilityLabel="Geri"
                hitSlop={4}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
                <Icon name="back" size={22} color={colors.textPrimary} />
            </Pressable>
            <Text accessibilityRole="header" style={styles.headerTitle}>Alışveriş listesi</Text>
            <View style={styles.headerBalance} accessible={false} />
        </View>
    );
}

function GroceryItem({ item, pending, onToggle, onDelete }) {
    const completionLabel = item.isCompleted
        ? `${item.name}, tamamlandı. Tekrar aktif yapmak için dokunun.`
        : `${item.name}, aktif. Tamamlandı olarak işaretlemek için dokunun.`;

    return (
        <AppCard style={styles.itemCard} contentStyle={styles.itemContent}>
            <Pressable
                onPress={pending ? undefined : onToggle}
                disabled={pending}
                accessibilityRole="checkbox"
                accessibilityLabel={completionLabel}
                accessibilityState={{ checked: item.isCompleted, disabled: pending, busy: pending }}
                style={({ pressed }) => [styles.checkButton, pending && styles.disabled, pressed && !pending && styles.pressed]}
            >
                <View style={[styles.checkbox, item.isCompleted && styles.checkboxCompleted]}>
                    {item.isCompleted ? <Icon name="check" size={18} color={colors.white} /> : null}
                </View>
            </Pressable>
            <Text style={[styles.itemName, item.isCompleted && styles.itemNameCompleted]}>{item.name}</Text>
            <Pressable
                onPress={pending ? undefined : onDelete}
                disabled={pending}
                accessibilityRole="button"
                accessibilityLabel={`${item.name} ürününü sil`}
                accessibilityState={{ disabled: pending, busy: pending }}
                hitSlop={6}
                style={({ pressed }) => [styles.deleteButton, pending && styles.disabled, pressed && !pending && styles.pressed]}
            >
                {pending ? <ActivityIndicator size="small" color={colors.textSecondary} /> : <Icon name="trash" size={21} color={colors.errorDark} />}
            </Pressable>
        </AppCard>
    );
}

export default function GroceryListScreen({ navigation }) {
    const {
        items,
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

    const confirmDelete = (item) => {
        if (pendingItemIds[item.id]) return;
        Alert.alert(
            'Ürünü sil',
            'Bu ürünü listeden silmek istiyor musunuz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Sil', style: 'destructive', onPress: () => { void deleteItem(item.id); } },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <AppScreen
                scroll
                header={<ScreenHeader navigation={navigation} />}
                contentStyle={styles.content}
            >
            <View>
                <Text style={styles.title} accessibilityRole="header">Alışveriş listesi</Text>
                <Text style={styles.subtitle}>İhtiyacınız olan ürünleri ekleyin ve aldıkça işaretleyin.</Text>
            </View>

            <AppCard contentStyle={styles.form}>
                <AppInput
                    label="Ürün adı"
                    value={input}
                    onChangeText={setInput}
                    placeholder="Örneğin: Süt"
                    error={inputError}
                    maxLength={120}
                    editable={!isAdding && canMutate}
                    accessibilityLabel="Ürün adı"
                    returnKeyType="done"
                    onSubmitEditing={() => { void addItem(); }}
                />
                <AppButton
                    label="Ekle"
                    onPress={() => { void addItem(); }}
                    loading={isAdding}
                    disabled={!canMutate}
                    accessibilityLabel="Alışveriş listesine ürün ekle"
                />
            </AppCard>

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
                    {items.map((item) => (
                        <GroceryItem
                            key={item.id}
                            item={item}
                            pending={!!pendingItemIds[item.id]}
                            onToggle={() => { void toggleItem(item.id); }}
                            onDelete={() => confirmDelete(item)}
                        />
                    ))}
                </View>
            ) : null}
            </AppScreen>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: spacing.x4, paddingBottom: spacing.x8, gap: spacing.x4 },
    header: {
        minHeight: 60,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.x3,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
        backgroundColor: colors.surface,
    },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { flex: 1, ...typography.sectionTitle, color: colors.textPrimary, textAlign: 'center' },
    headerBalance: { width: 44, height: 44 },
    title: { ...typography.screenTitle, color: colors.textPrimary },
    subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    form: { gap: spacing.x3 },
    loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.x8, gap: spacing.x2 },
    stateText: { ...typography.supporting, color: colors.textSecondary },
    list: { gap: spacing.x3 },
    itemCard: { padding: spacing.x3 },
    itemContent: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    checkButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    checkbox: { width: 26, height: 26, borderRadius: radius.control, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
    checkboxCompleted: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
    itemName: { ...typography.body, color: colors.textPrimary, flex: 1 },
    itemNameCompleted: { color: colors.textSecondary, textDecorationLine: 'line-through' },
    deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    disabled: { opacity: 0.55 },
    pressed: { opacity: 0.75 },
});
