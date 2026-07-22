import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import { useMeals } from '../../meals/context/MealsContext';
import { getClientProfile, getDailyQuote } from '../services/clientService';
import { getDailyLog, upsertWaterIntake, upsertDailyWeight } from '../services/dailyLogService';
import { getDailyMealPlan } from '../../meals/services/mealService';
import { getNextIncompleteMeal } from '../../meals/services/mealReadModel';
import { toLocalDateKey } from '../../../shared/utils/localDate';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
} from '../../dietitianConnection/services/dietitianConnectionService';

const toFiniteNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};

const buildNutritionSummary = (meals) => {
    const completedMeals = meals.filter((meal) => meal.isEaten);
    const sumMeals = (items) => items.reduce((totals, meal) => ({
        calories: totals.calories + toFiniteNumber(meal.calories),
        protein: totals.protein + toFiniteNumber(meal.protein),
        carbohydrate: totals.carbohydrate + toFiniteNumber(meal.carbohydrate),
        fat: totals.fat + toFiniteNumber(meal.fat),
    }), { calories: 0, protein: 0, carbohydrate: 0, fat: 0 });

    return {
        planned: sumMeals(meals),
        consumed: sumMeals(completedMeals),
        completedCount: completedMeals.length,
    };
};

export const useDashboardViewModel = () => {
    const { completedMeals, hydrateCompletedMeals, toggleMealCompletion } = useMeals();
    const [water, setWater] = useState(0);
    const [waterInput, setWaterInput] = useState('200');
    const [dailyLogStatus, setDailyLogStatus] = useState('loading');
    const [dailyLogError, setDailyLogError] = useState(null);
    const [isAddingWater, setIsAddingWater] = useState(false);
    const [isUndoingWater, setIsUndoingWater] = useState(false);
    const [weight, setWeight] = useState(null);
    const [weightInput, setWeightInput] = useState('');
    const [isSavingWeight, setIsSavingWeight] = useState(false);
    const [meals, setMeals] = useState([]);
    const [mealPlanStatus, setMealPlanStatus] = useState('loading');
    const [mealPlanError, setMealPlanError] = useState(null);
    const [focusedMealId, setFocusedMealId] = useState(null);
    const [userName, setUserName] = useState('Kullanıcı');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [dailyQuote, setDailyQuote] = useState('');
    const [updatingMealId, setUpdatingMealId] = useState(null);
    const mealRequestVersionsRef = useRef({});
    const mealMutationsRef = useRef(new Set());
    const waterMutationRef = useRef(null);
    const weightMutationRef = useRef(false);
    const planRequestSequenceRef = useRef(0);
    const inFlightPlanRequestsRef = useRef(new Map());
    const isMountedRef = useRef(true);
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

    useEffect(() => () => {
        isMountedRef.current = false;
        planRequestSequenceRef.current += 1;
        inFlightPlanRequestsRef.current.clear();
    }, []);

    const loadTodayMeals = useCallback((now = new Date(), { retry = false, force = false } = {}) => {
        const planDate = toLocalDateKey(now);
        const existingRequest = inFlightPlanRequestsRef.current.get(planDate);
        if (existingRequest && !force) return existingRequest;

        const requestSequence = planRequestSequenceRef.current + 1;
        planRequestSequenceRef.current = requestSequence;
        if (isMountedRef.current) {
            setMealPlanStatus(retry ? 'retrying' : 'loading');
            setMealPlanError(null);
            setMeals([]);
            setFocusedMealId(null);
        }

        const request = getDailyMealPlan(planDate)
            .then((result) => {
                if (!isMountedRef.current || planRequestSequenceRef.current !== requestSequence) return result;

                hydrateCompletedMeals(result.meals);
                setMeals(result.meals);
                setMealPlanStatus(result.status);
                return result;
            })
            .catch((error) => {
                if (!isMountedRef.current || planRequestSequenceRef.current !== requestSequence) return null;

                setMeals([]);
                setMealPlanStatus('error');
                setMealPlanError(error?.message || CONNECTION_GENERIC_ERROR_MESSAGE);
                return null;
            })
            .finally(() => {
                if (inFlightPlanRequestsRef.current.get(planDate) === request) {
                    inFlightPlanRequestsRef.current.delete(planDate);
                }
            });

        inFlightPlanRequestsRef.current.set(planDate, request);
        return request;
    }, [hydrateCompletedMeals]);

    const retryMealPlan = useCallback(() => (
        loadTodayMeals(new Date(), { retry: true, force: true })
    ), [loadTodayMeals]);

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return 'Günaydın';
        if (hour >= 11 && hour < 17) return 'İyi günler';
        if (hour >= 17 && hour < 22) return 'İyi akşamlar';
        return 'İyi geceler';
    }, []);

    const loadWaterIntake = useCallback(async () => {
        setDailyLogStatus('loading');
        setDailyLogError(null);
        try {
            const log = await getDailyLog(toLocalDateKey());
            if (!isMountedRef.current) return;
            if (log?.water_intake !== undefined && log?.water_intake !== null) {
                setWater(log.water_intake);
                setDailyLogStatus('ready');
            } else {
                setWater(0);
                setDailyLogStatus('empty');
            }
        } catch (error) {
            if (!isMountedRef.current) return;
            console.warn('Daily log load failed:', error?.message || 'unknown error');
            setDailyLogStatus('error');
            setDailyLogError(error?.message || 'Günlük kayıt bilgileri yüklenemedi.');
        }
    }, []);

    const retryDailyLog = useCallback(() => loadWaterIntake(), [loadWaterIntake]);

    useFocusEffect(
        useCallback(() => {
            setDailyQuote(getDailyQuote());

            const loadProfile = async () => {
                try {
                    const profile = await getClientProfile();
                    const fullName = profile?.fullName?.trim();
                    if (fullName) setUserName(fullName.split(' ')[0]);
                    setAvatarUrl(profile?.avatarUrl || null);
                    if (profile?.currentWeight !== null && profile?.currentWeight !== undefined) {
                        setWeight(profile.currentWeight);
                        setWeightInput(String(profile.currentWeight));
                    }
                } catch (error) {
                    console.error('Failed to load dashboard profile:', error);
                }
            };

            refreshConnectionStatus();
            loadProfile();
            loadWaterIntake();
            loadTodayMeals();

            return () => {
                planRequestSequenceRef.current += 1;
                inFlightPlanRequestsRef.current.clear();
            };
        }, [loadTodayMeals, loadWaterIntake, refreshConnectionStatus]),
    );

    const waterProgress = Math.min(water / 3, 1);
    const firstIncompleteMeal = useMemo(() => getNextIncompleteMeal(meals), [meals]);
    const nutrition = useMemo(() => buildNutritionSummary(meals), [meals]);
    const displayedMeal = (
        (focusedMealId && meals.find((meal) => meal.id === focusedMealId))
        || firstIncompleteMeal
    );
    const isMealCompleted = !!displayedMeal?.isEaten;
    const displayedCompletionPhotoUri = displayedMeal?.id
        ? completedMeals[displayedMeal.id]?.completionPhotoUri || null
        : null;

    const addWater = async (amountMl) => {
        if (waterMutationRef.current) return;
        const amount = parseInt(amountMl ?? waterInput, 10) || 200;
        const previousWater = water;
        const previousStatus = dailyLogStatus;
        const previousError = dailyLogError;
        const nextWater = Math.min(water + amount / 1000, 5);
        waterMutationRef.current = 'add';
        setIsAddingWater(true);
        setWater(nextWater);
        try {
            await upsertWaterIntake(toLocalDateKey(), nextWater);
            if (isMountedRef.current) {
                setDailyLogStatus('ready');
                setDailyLogError(null);
            }
        } catch (error) {
            setWater(previousWater);
            setDailyLogStatus(previousStatus);
            setDailyLogError(previousError);
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            waterMutationRef.current = null;
            if (isMountedRef.current) setIsAddingWater(false);
        }
    };

    const removeWater = async (amountMl) => {
        if (waterMutationRef.current) return;
        const amount = parseInt(amountMl ?? waterInput, 10) || 200;
        const previousWater = water;
        const previousStatus = dailyLogStatus;
        const previousError = dailyLogError;
        const nextWater = Math.max(water - amount / 1000, 0);
        waterMutationRef.current = 'remove';
        setIsUndoingWater(true);
        setWater(nextWater);
        try {
            await upsertWaterIntake(toLocalDateKey(), nextWater);
            if (isMountedRef.current) {
                setDailyLogStatus('ready');
                setDailyLogError(null);
            }
        } catch (error) {
            setWater(previousWater);
            setDailyLogStatus(previousStatus);
            setDailyLogError(previousError);
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            waterMutationRef.current = null;
            if (isMountedRef.current) setIsUndoingWater(false);
        }
    };

    const completeMealById = async (mealId, completionPhotoUri = null) => {
        const targetMeal = meals.find((meal) => meal.id === mealId);
        if (!targetMeal?.id) {
            Alert.alert('Hata', 'Geçerli öğün ID bulunamadı.');
            return;
        }

        if (mealMutationsRef.current.has(mealId)) return;
        const previousIsEaten = !!targetMeal.isEaten;
        const nextIsEaten = !previousIsEaten;
        const requestVersion = (mealRequestVersionsRef.current[mealId] || 0) + 1;
        mealRequestVersionsRef.current[mealId] = requestVersion;
        mealMutationsRef.current.add(mealId);
        setUpdatingMealId(mealId);
        setMeals((currentMeals) => currentMeals.map((meal) => (
            meal.id === mealId ? { ...meal, isEaten: nextIsEaten } : meal
        )));
        setFocusedMealId(mealId);

        try {
            const updatedMeal = await toggleMealCompletion(mealId, {
                completed: nextIsEaten,
                completionPhotoUri: nextIsEaten ? completionPhotoUri : null,
            });
            if (mealRequestVersionsRef.current[mealId] !== requestVersion) return;

            setMeals((currentMeals) => currentMeals.map((meal) => (
                meal.id === mealId
                    ? { ...meal, isEaten: updatedMeal?.isEaten ?? nextIsEaten }
                    : meal
            )));
        } catch (error) {
            if (mealRequestVersionsRef.current[mealId] === requestVersion) {
                setMeals((currentMeals) => currentMeals.map((meal) => (
                    meal.id === mealId ? { ...meal, isEaten: previousIsEaten } : meal
                )));
            }
            Alert.alert('Hata', 'Öğün durumu güncellenemedi. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
        } finally {
            mealMutationsRef.current.delete(mealId);
            if (isMountedRef.current) {
                setUpdatingMealId((currentId) => (currentId === mealId ? null : currentId));
            }
        }
    };

    const completeMeal = async (completionPhotoUri = null) => {
        if (!displayedMeal?.id) {
            Alert.alert('Hata', 'Geçerli öğün ID bulunamadı.');
            return;
        }
        await completeMealById(displayedMeal.id, completionPhotoUri);
    };

    const handleSaveWeight = async () => {
        if (weightMutationRef.current) return;
        const normalizedWeight = weightInput.trim().replace(',', '.');
        const isNumericInput = /^\d+(?:\.\d+)?$/.test(normalizedWeight);
        const numWeight = Number(normalizedWeight);
        if (!isNumericInput || !Number.isFinite(numWeight) || numWeight < 20 || numWeight > 500) {
            Alert.alert('Hata', 'Lütfen geçerli bir kilo giriniz.');
            return;
        }
        weightMutationRef.current = true;
        setIsSavingWeight(true);
        try {
            await upsertDailyWeight(toLocalDateKey(), numWeight);
            setWeight(numWeight);
            Alert.alert('Başarılı', 'Güncel kilonuz kaydedildi.');
        } catch (error) {
            Alert.alert('Hata', 'Kilonuz kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            weightMutationRef.current = false;
            if (isMountedRef.current) setIsSavingWeight(false);
        }
    };

    const handleGoToNextMeal = () => setFocusedMealId(firstIncompleteMeal?.id || null);

    const handleApproveDietitianRequest = async () => {
        if (!pendingRequest?.id) return;
        try {
            await approvePendingRequest(pendingRequest.id);
            Alert.alert('Başarılı', 'Diyetisyen bağlantınız onaylandı.');
            await loadTodayMeals(new Date(), { force: true });
        } catch (error) {
            Alert.alert('Hata', error.message || CONNECTION_GENERIC_ERROR_MESSAGE);
        }
    };

    const handleRejectDietitianRequest = async () => {
        if (!pendingRequest?.id) return;
        try {
            await rejectPendingRequest(pendingRequest.id);
            setMeals([]);
            setMealPlanStatus('unlinked');
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
        completedMeals,
        meals,
        mealPlanStatus,
        mealPlanError,
        retryMealPlan,
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
        displayedMeal,
        displayedCompletionPhotoUri,
        isMealCompleted,
        addWater,
        removeWater,
        completeMeal,
        completeMealById,
        updatingMealId,
        focusedMealId,
        setFocusedMealId,
        handleGoToNextMeal,
        firstIncompleteMeal,
        weight,
        weightInput,
        setWeightInput,
        handleSaveWeight,
        isSavingWeight,
        handleApproveDietitianRequest,
        handleRejectDietitianRequest,
    };
};
