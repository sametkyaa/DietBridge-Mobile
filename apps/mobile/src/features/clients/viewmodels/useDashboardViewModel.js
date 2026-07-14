import { useState, useMemo, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useMeals } from '../../meals/context/MealsContext';
import { getClientProfile, getDailyQuote } from '../services/clientService';
import { getDailyLog, upsertWaterIntake, upsertDailyWeight } from '../services/dailyLogService';
import { getDailyMeals } from '../../meals/services/mealService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
} from '../../dietitianConnection/services/dietitianConnectionService';
import { Alert } from 'react-native';

export const useDashboardViewModel = () => {
    const { hydrateCompletedMeals, toggleMealCompletion } = useMeals();
    const [water, setWater] = useState(0);
    const [waterInput, setWaterInput] = useState('200');
    const [weight, setWeight] = useState(null);
    const [weightInput, setWeightInput] = useState('');
    const [meals, setMeals] = useState([]);
    const [focusedMealId, setFocusedMealId] = useState(null);
    const [userName, setUserName] = useState('Kullanıcı');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [dailyQuote, setDailyQuote] = useState('');
    const mealRequestVersionsRef = useRef({});
    const {
        connectionStatus,
        activeDietitian,
        pendingRequest,
        hasActiveDietitian,
        isLoadingConnection,
        connectionAction,
        connectionError,
        refreshConnectionStatus,
        approvePendingRequest,
        rejectPendingRequest,
    } = useDietitianConnection();

    const getSafeTodayStr = useCallback(() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }, []);

    const loadTodayMeals = useCallback(async () => {
        const todayStr = getSafeTodayStr();
        const todayMeals = await getDailyMeals(todayStr);
        console.log('Loaded dashboard meals:', todayMeals.map((meal) => ({
            id: meal.id,
            planId: meal.plan_id,
            type: meal.type,
            isEaten: meal.is_eaten,
        })));
        hydrateCompletedMeals(todayMeals);
        setMeals(todayMeals);
    }, [getSafeTodayStr, hydrateCompletedMeals]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();

        if (hour >= 5 && hour < 11) return 'Günaydın';
        if (hour >= 11 && hour < 17) return 'İyi günler';
        if (hour >= 17 && hour < 22) return 'İyi akşamlar';
        return 'İyi geceler';
    }, []);

    useFocusEffect(
        useCallback(() => {
            // Load Daily Quote
            setDailyQuote(getDailyQuote());

            // Load User Profile
            const loadProfile = async () => {
                try {
                    const profile = await getClientProfile();
                    const fullName = profile?.fullName?.trim();
                    if (fullName) {
                        setUserName(fullName.split(' ')[0]);
                    }
                    setAvatarUrl(profile?.avatarUrl || null);
                    if (profile?.currentWeight !== null && profile?.currentWeight !== undefined) {
                        setWeight(profile.currentWeight);
                        setWeightInput(String(profile.currentWeight));
                    }
                } catch (error) {
                    console.error('Failed to load dashboard profile:', error);
                }
            };
            const loadWaterIntake = async () => {
                try {
                    const todayStr = getSafeTodayStr();
                    const log = await getDailyLog(todayStr);
                    if (log) {
                        if (log.water_intake !== undefined && log.water_intake !== null) {
                            setWater(log.water_intake);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load water intake:", error);
                }
            };
            const loadConnectionAndMeals = async () => {
                try {
                    const currentConnection = await refreshConnectionStatus();
                    if (currentConnection.hasActiveDietitian) {
                        await loadTodayMeals();
                    } else {
                        setMeals([]);
                    }
                } catch (error) {
                    console.error("Failed to load connection or today's meals:", error);
                    setMeals([]);
                }
            };

            loadProfile();
            loadWaterIntake();
            loadConnectionAndMeals();
        }, [getSafeTodayStr, loadTodayMeals, refreshConnectionStatus])
    );

    const waterProgress = Math.min(water / 3, 1);

    const firstIncompleteMeal = useMemo(
        () => meals.find((meal) => !meal.is_eaten),
        [meals],
    );

    const displayedMeal =
        (focusedMealId && meals.find((meal) => meal.id === focusedMealId)) || firstIncompleteMeal;

    const isMealCompleted = !!displayedMeal?.is_eaten;

    const addWater = async () => {
        const amount = parseInt(waterInput, 10) || 200;
        const newWater = Math.min(water + amount / 1000, 5); // Max 5L for safety
        const prevWater = water;
        
        setWater(newWater); // Optimistic UI
        try {
            const todayStr = getSafeTodayStr();
            await upsertWaterIntake(todayStr, newWater);
        } catch (error) {
            setWater(prevWater); // Rollback
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        }
    };

    const removeWater = async () => {
        const amount = parseInt(waterInput, 10) || 200;
        const newWater = Math.max(water - amount / 1000, 0);
        const prevWater = water;

        setWater(newWater); // Optimistic UI
        try {
            const todayStr = getSafeTodayStr();
            await upsertWaterIntake(todayStr, newWater);
        } catch (error) {
            setWater(prevWater); // Rollback
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        }
    };

    const completeMeal = async (photoUri = null) => {
        if (!displayedMeal?.id) {
            if (__DEV__) {
                console.error('Meal completion skipped: missing meal id');
            }
            Alert.alert('Hata', 'Geçerli öğün ID bulunamadı.');
            return;
        }

        const mealId = displayedMeal.id;
        const nextIsEaten = !isMealCompleted;
        const previousIsEaten = !!displayedMeal.is_eaten;
        const requestVersion = (mealRequestVersionsRef.current[mealId] || 0) + 1;

        mealRequestVersionsRef.current[mealId] = requestVersion;
        setMeals((currentMeals) => currentMeals.map((meal) => (
            meal.id === mealId ? { ...meal, is_eaten: nextIsEaten } : meal
        )));
        setFocusedMealId(mealId);

        try {
            const updatedMeal = await toggleMealCompletion(mealId, {
                completed: nextIsEaten,
                photoUri: nextIsEaten ? photoUri : null,
            });

            if (mealRequestVersionsRef.current[mealId] !== requestVersion) {
                return;
            }

            setMeals((currentMeals) => currentMeals.map((meal) => {
                if (meal.id !== mealId) return meal;

                return {
                    ...meal,
                    ...updatedMeal,
                    id: meal.id,
                    plan_id: updatedMeal?.plan_id || meal.plan_id,
                    title: updatedMeal?.title || meal.title,
                    type: updatedMeal?.type || meal.type,
                    time: meal.time,
                    desc: updatedMeal?.calories ? `${updatedMeal.calories} kcal` : meal.desc,
                    is_eaten: updatedMeal?.is_eaten ?? nextIsEaten,
                    photo_url: updatedMeal?.photo_url || meal.photo_url,
                };
            }));
        } catch (error) {
            if (mealRequestVersionsRef.current[mealId] === requestVersion) {
                setMeals((currentMeals) => currentMeals.map((meal) => (
                    meal.id === mealId ? { ...meal, is_eaten: previousIsEaten } : meal
                )));
            }

            if (__DEV__) {
                console.error('Failed to update meal completion.');
            }
            Alert.alert(
                'Hata',
                'Öğün durumu güncellenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
            );
        }
    };

    const handleSaveWeight = async () => {
        const numWeight = parseFloat(weightInput);
        if (isNaN(numWeight) || numWeight < 20 || numWeight > 500) {
            Alert.alert('Hata', 'Lütfen geçerli bir kilo giriniz.');
            return;
        }
        try {
            const todayStr = getSafeTodayStr();
            await upsertDailyWeight(todayStr, numWeight);
            setWeight(numWeight);
            Alert.alert('Başarılı', 'Güncel kilonuz kaydedildi.');
        } catch (error) {
            Alert.alert('Hata', 'Kilonuz kaydedilemedi. Lütfen tekrar deneyin.');
        }
    };

    const handleGoToNextMeal = () => {
        if (firstIncompleteMeal) {
            setFocusedMealId(firstIncompleteMeal.id);
        } else {
            setFocusedMealId(null);
        }
    };

    const handleApproveDietitianRequest = async () => {
        if (!pendingRequest?.id) return;

        try {
            await approvePendingRequest(pendingRequest.id);
            Alert.alert('Başarılı', 'Diyetisyen bağlantınız onaylandı.');
            await loadTodayMeals();
        } catch (error) {
            Alert.alert('Hata', error.message || CONNECTION_GENERIC_ERROR_MESSAGE);
        }
    };

    const handleRejectDietitianRequest = async () => {
        if (!pendingRequest?.id) return;

        try {
            await rejectPendingRequest(pendingRequest.id);
            setMeals([]);
            Alert.alert('Bilgi', 'Bağlantı isteği reddedildi.');
        } catch (error) {
            Alert.alert('Hata', error.message || CONNECTION_GENERIC_ERROR_MESSAGE);
        }
    };

    return {
        connectionStatus,
        activeDietitian,
        pendingRequest,
        hasActiveDietitian,
        isLoadingConnection,
        connectionAction,
        connectionError,
        connectionRequiredMessage: CONNECTION_REQUIRED_MESSAGE,
        meals,
        water,
        waterInput,
        setWaterInput,
        userName,
        greeting,
        avatarUrl,
        isSidebarVisible,
        setIsSidebarVisible,
        selectedMeal,
        setSelectedMeal,
        dailyQuote,
        waterProgress,
        displayedMeal,
        isMealCompleted,
        addWater,
        removeWater,
        completeMeal,
        focusedMealId,
        setFocusedMealId,
        handleGoToNextMeal,
        firstIncompleteMeal,
        weight,
        weightInput,
        setWeightInput,
        handleSaveWeight,
        handleApproveDietitianRequest,
        handleRejectDietitianRequest,
    };
};
