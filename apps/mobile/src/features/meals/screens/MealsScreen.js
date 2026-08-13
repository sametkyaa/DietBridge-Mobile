import React, { useCallback, useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    AppButton,
    AppCard,
    AppSkeleton,
    EmptyState,
    ErrorState,
    InlineAlert,
} from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { getLocalWeekDayIndex } from '../../../shared/utils/localDate';
import { MealDetailSheet } from '../components/MealDetailSheet';
import {
    GroceryListSheet,
    MealPhotoPreviewModal,
    MealPlanHeader,
    MealPlanItem,
    MealRequestSheet,
} from '../components/plan';
import { useMealsViewModel } from '../viewmodels/useMealsViewModel';

function LoadingState({ retrying }) {
    return (
        <AppCard style={screenStyles.stateCard}>
            <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={retrying ? 'Beslenme planı yeniden yükleniyor' : 'Beslenme planı yükleniyor'}
                accessibilityState={{ busy: true }}
                style={screenStyles.loading}
            >
                <AppSkeleton width={56} height={56} borderRadius={radius.small} animated />
                <View style={screenStyles.loadingText}>
                    <AppSkeleton width="55%" height={16} animated />
                    <AppSkeleton width="80%" height={12} animated />
                    <Text style={screenStyles.supporting}>{retrying ? 'Plan yeniden yükleniyor...' : 'Plan yükleniyor...'}</Text>
                </View>
            </View>
        </AppCard>
    );
}

const MealsScreen = () => {
    const insets = useSafeAreaInsets();
    const {
        dayOptions,
        selectedDay,
        setSelectedDay,
        selectedMeal,
        groceryModalVisible,
        setGroceryModalVisible,
        groceryItems,
        photoPreviewUri,
        completedMeals,
        requestModalVisible,
        setRequestModalVisible,
        requestSelectedDay,
        requestSelectedMeals,
        requestMessage,
        setRequestMessage,
        requestMeals,
        requestMealsStatus,
        requestMealsError,
        retryRequestMeals,
        handleOpenRequestModal,
        handleToggleRequestMeal,
        handleSendRequest,
        handleRequestDayChange,
        closeMealModal,
        closePhotoPreview,
        toggleGroceryItem,
        handleGenerateGroceryList,
        openMealModal,
        openPhotoPreview,
        meals,
        isLoadingMeals,
        mealPlanStatus,
        mealPlanError,
        retryMeals,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        connectionRequiredMessage,
        isSendingRequest,
    } = useMealsViewModel();

    const selectedCompletion = selectedMeal ? completedMeals[selectedMeal.id] : null;
    const showLoading = isLoadingMeals || (isLoadingConnection && mealPlanStatus === 'loading');
    const listData = mealPlanStatus === 'success' ? meals : [];
    const todayIndex = useMemo(() => {
        return getLocalWeekDayIndex();
    }, []);

    useEffect(() => {
        if (!hasActiveDietitian && photoPreviewUri) closePhotoPreview();
    }, [closePhotoPreview, hasActiveDietitian, photoPreviewUri]);

    const renderItem = useCallback(({ item }) => (
        <MealPlanItem meal={item} completion={completedMeals[item.id]} onPress={openMealModal} />
    ), [completedMeals, openMealModal]);

    const listEmpty = useMemo(() => {
        if (showLoading) return <LoadingState retrying={mealPlanStatus === 'retrying'} />;
        if (mealPlanStatus === 'unlinked') {
            return (
                <AppCard style={screenStyles.stateCard}>
                    <InlineAlert variant="warning" title="Diyetisyen bağlantısı gerekli" message={connectionRequiredMessage} />
                    {connectionError ? <InlineAlert variant="error" message={connectionError} style={screenStyles.alertGap} /> : null}
                </AppCard>
            );
        }
        if (mealPlanStatus === 'error') {
            return (
                <AppCard style={screenStyles.stateCard}>
                    <ErrorState title="Plan yüklenemedi" description={mealPlanError} onRetry={retryMeals} />
                </AppCard>
            );
        }
        return (
            <AppCard style={screenStyles.stateCard}>
                <EmptyState
                    icon="calendar"
                    title="Bu gün için plan bulunmuyor"
                    description="Diyetisyeniniz plan eklediğinde burada görünecek."
                />
            </AppCard>
        );
    }, [connectionError, connectionRequiredMessage, mealPlanError, mealPlanStatus, retryMeals, showLoading]);

    const header = useMemo(() => (
        <MealPlanHeader
            dayOptions={dayOptions}
            selectedDay={selectedDay}
            todayIndex={todayIndex}
            onSelectDay={setSelectedDay}
            onOpenGrocery={handleGenerateGroceryList}
            groceryDisabled={!hasActiveDietitian}
        />
    ), [dayOptions, handleGenerateGroceryList, hasActiveDietitian, selectedDay, setSelectedDay]);

    const footer = (
        <View style={screenStyles.footer}>
            <AppButton
                variant="secondary"
                label="Öğün değişikliği talep et"
                onPress={handleOpenRequestModal}
                disabled={!hasActiveDietitian}
            />
            {!hasActiveDietitian ? <Text style={screenStyles.supporting}>{connectionRequiredMessage}</Text> : null}
        </View>
    );

    return (
        <SafeAreaView style={screenStyles.safeArea} edges={['top', 'left', 'right']}>
            <FlatList
                data={listData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={screenStyles.separator} />}
                ListHeaderComponent={header}
                ListEmptyComponent={listEmpty}
                ListFooterComponent={footer}
                contentContainerStyle={screenStyles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />

            <MealDetailSheet
                meal={selectedMeal}
                completion={selectedCompletion}
                visible={!!selectedMeal && hasActiveDietitian}
                onClose={closeMealModal}
                onPhotoPress={openPhotoPreview}
                bottomInset={insets.bottom}
            />
            <GroceryListSheet
                visible={groceryModalVisible && hasActiveDietitian}
                items={groceryItems}
                onToggle={toggleGroceryItem}
                onClose={() => setGroceryModalVisible(false)}
                bottomInset={insets.bottom}
            />
            <MealRequestSheet
                visible={requestModalVisible && hasActiveDietitian}
                dayOptions={dayOptions}
                selectedDay={requestSelectedDay}
                selectedMeals={requestSelectedMeals}
                meals={requestMeals}
                mealsStatus={requestMealsStatus}
                mealsError={requestMealsError}
                onRetryMeals={retryRequestMeals}
                message={requestMessage}
                onDayChange={handleRequestDayChange}
                onToggleMeal={handleToggleRequestMeal}
                onMessageChange={setRequestMessage}
                onSend={handleSendRequest}
                onClose={() => setRequestModalVisible(false)}
                isSending={isSendingRequest}
                bottomInset={insets.bottom}
            />
            <MealPhotoPreviewModal uri={hasActiveDietitian ? photoPreviewUri : null} onClose={closePhotoPreview} />
        </SafeAreaView>
    );
};

const screenStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.x5, paddingTop: spacing.x3, paddingBottom: spacing.x8 },
    separator: { height: spacing.x3 },
    stateCard: { marginTop: spacing.x2 },
    loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.x3 },
    loadingText: { flex: 1, gap: spacing.x2 },
    supporting: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center' },
    alertGap: { marginTop: spacing.x3 },
    footer: { gap: spacing.x2, paddingTop: spacing.x5 },
});

export default MealsScreen;
