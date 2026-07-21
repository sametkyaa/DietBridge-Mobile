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

export const useDashboardViewModel = () => {
    const { completedMeals, hydrateCompletedMeals, toggleMealCompletion } = useMeals();
    const [water, setWater] = useState(0);
    const [waterInput, setWaterInput] = useState('200');
    const [weight, setWeight] = useState(null);
    const [weightInput, setWeightInput] = useState('');
    const [meals, setMeals] = useState([]);
    const [mealPlanStatus, setMealPlanStatus] = useState('loading');
    const [mealPlanError, setMealPlanError] = useState(null);
    const [focusedMealId, setFocusedMealId] = useState(null);
    const [userName, setUserName] = useState('Kullanıcı');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [dailyQuote, setDailyQuote] = useState('');
    const mealRequestVersionsRef = useRef({});
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

            const loadWaterIntake = async () => {
                try {
                    const log = await getDailyLog(toLocalDateKey());
                    if (log?.water_intake !== undefined && log?.water_intake !== null) {
                        setWater(log.water_intake);
                    }
                } catch (error) {
                    console.error('Failed to load water intake:', error);
                }
            };

            refreshConnectionStatus();
            loadProfile();
            loadWaterIntake();
            loadTodayMeals();

            return () => {
                planRequestSequenceRef.current += 1;
            };
        }, [loadTodayMeals, refreshConnectionStatus]),
    );

    const waterProgress = Math.min(water / 3, 1);
    const firstIncompleteMeal = useMemo(() => getNextIncompleteMeal(meals), [meals]);
    const displayedMeal = (
        (focusedMealId && meals.find((meal) => meal.id === focusedMealId))
        || firstIncompleteMeal
    );
    const isMealCompleted = !!displayedMeal?.isEaten;
    const displayedCompletionPhotoUri = displayedMeal?.id
        ? completedMeals[displayedMeal.id]?.completionPhotoUri || null
        : null;

    const addWater = async () => {
        const amount = parseInt(waterInput, 10) || 200;
        const previousWater = water;
        const nextWater = Math.min(water + amount / 1000, 5);
        setWater(nextWater);
        try {
            await upsertWaterIntake(toLocalDateKey(), nextWater);
        } catch (error) {
            setWater(previousWater);
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        }
    };

    const removeWater = async () => {
        const amount = parseInt(waterInput, 10) || 200;
        const previousWater = water;
        const nextWater = Math.max(water - amount / 1000, 0);
        setWater(nextWater);
        try {
            await upsertWaterIntake(toLocalDateKey(), nextWater);
        } catch (error) {
            setWater(previousWater);
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        }
    };

    const completeMeal = async (completionPhotoUri = null) => {
        if (!displayedMeal?.id) {
            Alert.alert('Hata', 'Geçerli öğün ID bulunamadı.');
            return;
        }

        const mealId = displayedMeal.id;
        const nextIsEaten = !isMealCompleted;
        const previousIsEaten = !!displayedMeal.isEaten;
        const requestVersion = (mealRequestVersionsRef.current[mealId] || 0) + 1;
        mealRequestVersionsRef.current[mealId] = requestVersion;
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
        }
    };

    const handleSaveWeight = async () => {
        const numWeight = parseFloat(weightInput);
        if (Number.isNaN(numWeight) || numWeight < 20 || numWeight > 500) {
            Alert.alert('Hata', 'Lütfen geçerli bir kilo giriniz.');
            return;
        }
        try {
            await upsertDailyWeight(toLocalDateKey(), numWeight);
            setWeight(numWeight);
            Alert.alert('Başarılı', 'Güncel kilonuz kaydedildi.');
        } catch (error) {
            Alert.alert('Hata', 'Kilonuz kaydedilemedi. Lütfen tekrar deneyin.');
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
        meals,
        mealPlanStatus,
        mealPlanError,
        retryMealPlan,
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
        displayedCompletionPhotoUri,
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
