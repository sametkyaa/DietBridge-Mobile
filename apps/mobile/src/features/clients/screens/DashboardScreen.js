import React, { useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, findNodeHandle, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppCard } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import {
    DashboardHeader,
    DashboardMealDetailSheet,
    DashboardSidebar,
    NextMealCard,
    MealPhotoPromptModal,
    NutritionOverviewCard,
    TodayMealsCard,
    WaterTrackerCard,
    WeightCard,
} from '../components/dashboard';
import { mapDashboardMeal } from '../mappers/dashboardUiMapper';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';
import { toLocalDateKey } from '../../../shared/utils/localDate';
import DietitianConnectionRequestCard from '../../dietitianConnection/components/DietitianConnectionRequestCard';
import { useNotifications } from '../../notifications/context/NotificationContext';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { unseenCount } = useNotifications();
    const {
        water,
        waterInput,
        setWaterInput,
        dailyLogStatus,
        dailyLogError,
        retryDailyLog,
        isAddingWater,
        isUndoingWater,
        userName,
        greeting,
        avatarUrl,
        isSidebarVisible,
        setIsSidebarVisible,
        selectedMeal,
        setSelectedMeal,
        dailyQuote,
        waterProgress,
        nutrition,
        completedMeals,
        meals,
        mealPlanStatus,
        mealPlanError,
        retryMealPlan,
        displayedMeal,
        displayedCompletionPhotoUri,
        isMealCompleted,
        addWater,
        removeWater,
        completeMeal,
        completeMealById,
        updatingMealId,
        handleGoToNextMeal,
        firstIncompleteMeal,
        weight,
        weightInput,
        setWeightInput,
        handleSaveWeight,
        isSavingWeight,
        hasActiveDietitian,
        connectionRequiredMessage,
        pendingRequest,
        connectionAction,
        connectionError,
        handleApproveDietitianRequest,
        handleRejectDietitianRequest,
    } = useDashboardViewModel();
    const [isPhotoPromptVisible, setIsPhotoPromptVisible] = useState(false);
    const [isPhotoPickerActive, setIsPhotoPickerActive] = useState(false);
    const completionButtonRef = useRef(null);

    const dateLabel = useMemo(() => new Date(`${toLocalDateKey()}T12:00:00Z`).toLocaleDateString('tr-TR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    }), []);

    const uiMeals = useMemo(() => meals.map((meal) => mapDashboardMeal(
        meal,
        completedMeals[meal.id]?.completionPhotoUri || null,
    )), [completedMeals, meals]);
    const displayedUiMeal = useMemo(() => (
        displayedMeal ? mapDashboardMeal(displayedMeal, displayedCompletionPhotoUri) : null
    ), [displayedCompletionPhotoUri, displayedMeal]);
    const selectedUiMeal = useMemo(() => (
        selectedMeal
            ? mapDashboardMeal(selectedMeal, completedMeals[selectedMeal.id]?.completionPhotoUri || null)
            : null
    ), [completedMeals, selectedMeal]);
    const isDisplayedMealUpdating = !!displayedMeal?.id && updatingMealId === displayedMeal.id;

    const restoreCompletionFocus = () => {
        setTimeout(() => {
            const node = findNodeHandle(completionButtonRef.current);
            if (node) AccessibilityInfo.setAccessibilityFocus(node);
        }, 250);
    };

    const closePhotoPrompt = () => {
        if (isPhotoPickerActive || isDisplayedMealUpdating) return;
        setIsPhotoPromptVisible(false);
        restoreCompletionFocus();
    };

    const handleAddPhoto = async (source) => {
        if (!displayedMeal || !hasActiveDietitian || isDisplayedMealUpdating) return;

        try {
            const pickers = {
                camera: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('İzin gerekli', 'Kamera izni verilmedi.');
                        return null;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        quality: 0.7,
                    });
                    return result.canceled ? null : result.assets?.[0]?.uri || null;
                },
                gallery: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('İzin gerekli', 'Galeri izni verilmedi.');
                        return null;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        quality: 0.8,
                    });
                    return result.canceled ? null : result.assets?.[0]?.uri || null;
                },
            };

            const uri = await pickers[source]?.();
            if (uri) await completeMeal(uri);
        } catch (error) {
            console.warn('Fotoğraf ekleme hatası', error);
            Alert.alert('Fotoğraf eklenemedi', 'Lütfen tekrar deneyin.');
        }
    };

    const promptForPhoto = () => {
        if (!displayedMeal || !hasActiveDietitian || isDisplayedMealUpdating || isPhotoPickerActive) return;
        setIsPhotoPromptVisible(true);
    };

    const handlePhotoSource = async (source) => {
        if (isPhotoPickerActive || isDisplayedMealUpdating) return;
        setIsPhotoPromptVisible(false);
        setIsPhotoPickerActive(true);
        try {
            await handleAddPhoto(source);
        } finally {
            setIsPhotoPickerActive(false);
        }
    };

    const handleCompleteWithoutPhoto = async () => {
        if (isDisplayedMealUpdating) return;
        setIsPhotoPromptVisible(false);
        await completeMeal();
    };

    const handleToggleMealCompletion = async () => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', connectionRequiredMessage);
            return;
        }
        if (!displayedMeal || isDisplayedMealUpdating) return;
        if (isMealCompleted) {
            await completeMeal();
            return;
        }
        promptForPhoto();
    };

    const handleSidebarNavigation = (routeName) => {
        setIsSidebarVisible(false);
        navigation.navigate(routeName);
    };

    const handleMealPress = (mealId) => {
        const meal = meals.find((item) => item.id === mealId);
        if (meal) setSelectedMeal(meal);
    };

    const handleTodayMealToggle = async (mealId) => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', connectionRequiredMessage);
            return;
        }
        await completeMealById(mealId);
    };

    return (
        <SafeAreaView style={screenStyles.safeArea} edges={['top', 'left', 'right']}>
            <ScrollView
                contentContainerStyle={screenStyles.content}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <DashboardHeader
                    greeting={greeting}
                    userName={userName}
                    dateLabel={dateLabel}
                    avatarUrl={avatarUrl}
                    onAvatarPress={() => setIsSidebarVisible(true)}
                    unseenCount={unseenCount}
                    onNotificationPress={() => navigation.navigate('NotificationCenter')}
                />

                <DietitianConnectionRequestCard
                    request={pendingRequest}
                    action={connectionAction}
                    error={connectionError}
                    onApprove={handleApproveDietitianRequest}
                    onReject={handleRejectDietitianRequest}
                />

                {hasActiveDietitian && mealPlanStatus === 'success' ? (
                    <NutritionOverviewCard nutrition={nutrition} />
                ) : null}

                <NextMealCard
                    meal={displayedUiMeal}
                    status={mealPlanStatus}
                    error={mealPlanError}
                    unlinkedMessage={connectionRequiredMessage}
                    isUpdating={isDisplayedMealUpdating}
                    onToggle={handleToggleMealCompletion}
                    onDetail={() => setSelectedMeal(displayedMeal)}
                    onRetry={retryMealPlan}
                    onNextMeal={handleGoToNextMeal}
                    hasNextMeal={!!firstIncompleteMeal && firstIncompleteMeal.id !== displayedMeal?.id}
                    completionButtonRef={completionButtonRef}
                />

                <WaterTrackerCard
                    water={water}
                    waterInput={waterInput}
                    onWaterInputChange={setWaterInput}
                    progress={waterProgress}
                    status={dailyLogStatus}
                    error={dailyLogError}
                    isAdding={isAddingWater}
                    isUndoing={isUndoingWater}
                    onAdd={addWater}
                    onRemove={removeWater}
                    onRetry={retryDailyLog}
                />

                <WeightCard
                    weight={weight}
                    value={weightInput}
                    onChange={setWeightInput}
                    onSave={handleSaveWeight}
                    isSaving={isSavingWeight}
                />

                {mealPlanStatus === 'success' ? (
                    <TodayMealsCard
                        meals={uiMeals}
                        updatingMealId={updatingMealId}
                        onMealPress={handleMealPress}
                        onToggle={handleTodayMealToggle}
                    />
                ) : null}

                <AppCard>
                    <Text style={screenStyles.quoteTitle}>Günün motivasyonu</Text>
                    <Text style={screenStyles.quote}>“{dailyQuote}”</Text>
                </AppCard>
            </ScrollView>

            <DashboardSidebar
                visible={isSidebarVisible}
                userName={userName}
                avatarUrl={avatarUrl}
                topInset={insets.top}
                onClose={() => setIsSidebarVisible(false)}
                onNavigate={handleSidebarNavigation}
            />
            <DashboardMealDetailSheet
                meal={selectedUiMeal}
                visible={!!selectedUiMeal && hasActiveDietitian}
                bottomInset={insets.bottom}
                onClose={() => setSelectedMeal(null)}
            />
            <MealPhotoPromptModal
                visible={isPhotoPromptVisible}
                disabled={isPhotoPickerActive || isDisplayedMealUpdating}
                onClose={closePhotoPrompt}
                onCompleteWithoutPhoto={handleCompleteWithoutPhoto}
                onSelectSource={handlePhotoSource}
            />
        </SafeAreaView>
    );
};

const screenStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.x5, paddingTop: spacing.x3, paddingBottom: spacing.x8, gap: spacing.x3 },
    quoteTitle: { ...typography.bodyMedium, color: colors.textPrimary },
    quote: { ...typography.body, color: colors.textSecondary, textAlign: 'center', fontStyle: 'italic', marginTop: spacing.x2 },
});

export default DashboardScreen;
