import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, AppState } from 'react-native';
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
const { hasSessionChanged, normalizeSessionUserId } = require('./sessionDataIsolation.cjs');
const {
    INVALID_PERSISTED_WATER_MESSAGE,
    WATER_INPUT_VALIDATION_MESSAGE,
    WATER_TARGET_LITERS,
    addWaterLiters,
    getWaterProgress,
    isWaterLoadCurrent: isWaterLoadCurrentContract,
    isWaterMutationCurrent: isWaterMutationCurrentContract,
    normalizePersistedWaterLiters,
    normalizeWaterTargetLitersFromMl,
    parseWaterInputMl,
    removeWaterLiters,
} = require('../../../shared/utils/waterTrackingContract.cjs');

const toFiniteNumber = (value) => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const toNonNegativeFiniteNumber = (value) => {
    const number = toFiniteNumber(value);
    return number !== null && number >= 0 ? number : null;
};

export const buildNutritionSummary = (meals) => {
    const completedMeals = meals.filter((meal) => meal.isEaten);
    const sumMeals = (items) => {
        const totals = {
            calories: { value: 0, count: 0 },
            protein: { value: 0, count: 0 },
            carbohydrate: { value: 0, count: 0 },
            fat: { value: 0, count: 0 },
        };

        items.forEach((meal) => {
            Object.entries({
                calories: meal.calories,
                protein: meal.protein,
                carbohydrate: meal.carbohydrate,
                fat: meal.fat,
            }).forEach(([key, value]) => {
                const numberValue = toNonNegativeFiniteNumber(value);
                if (numberValue === null) return;
                totals[key].value += numberValue;
                totals[key].count += 1;
            });
        });

        return Object.fromEntries(Object.entries(totals).map(([key, total]) => [
            key,
            total.count > 0 ? total.value : null,
        ]));
    };

    return {
        planned: sumMeals(meals),
        consumed: sumMeals(completedMeals),
        completedCount: completedMeals.length,
        hasMacroData: meals.some((meal) => (
            toNonNegativeFiniteNumber(meal.calories) !== null
            || toNonNegativeFiniteNumber(meal.protein) !== null
            || toNonNegativeFiniteNumber(meal.carbohydrate) !== null
            || toNonNegativeFiniteNumber(meal.fat) !== null
        )),
    };
};

export const useDashboardViewModel = () => {
    const { completedMeals, hydrateCompletedMeals, toggleMealCompletion } = useMeals();
    const {
        userId,
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
    const [water, setWater] = useState(0);
    const [waterTargetLiters, setWaterTargetLiters] = useState(WATER_TARGET_LITERS);
    const [waterInput, setWaterInput] = useState('200');
    const [waterDateKey, setWaterDateKey] = useState(null);
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
    const waterDateKeyRef = useRef(null);
    const waterLoadSequenceRef = useRef(0);
    const waterMutationSequenceRef = useRef(0);
    const weightMutationRef = useRef(false);
    const planRequestSequenceRef = useRef(0);
    const inFlightPlanRequestsRef = useRef(new Map());
    const profileRequestSequenceRef = useRef(0);
    const isMountedRef = useRef(true);
    const previousUserIdRef = useRef(normalizeSessionUserId(userId));
    const sessionGenerationRef = useRef(0);

    const updateWaterDateKey = useCallback((dateKey) => {
        waterDateKeyRef.current = dateKey;
        setWaterDateKey(dateKey);
    }, []);

    useEffect(() => {
        const nextUserId = normalizeSessionUserId(userId);
        if (!hasSessionChanged(previousUserIdRef.current, nextUserId)) return;
        previousUserIdRef.current = nextUserId;
        sessionGenerationRef.current += 1;
        planRequestSequenceRef.current += 1;
        inFlightPlanRequestsRef.current.clear();
        mealRequestVersionsRef.current = {};
        mealMutationsRef.current.clear();
        waterMutationRef.current = null;
        profileRequestSequenceRef.current += 1;
        waterLoadSequenceRef.current += 1;
        waterMutationSequenceRef.current += 1;
        waterDateKeyRef.current = null;
        weightMutationRef.current = false;
        if (!isMountedRef.current) return;
        setWater(0);
        setWaterTargetLiters(WATER_TARGET_LITERS);
        updateWaterDateKey(null);
        setWeight(null);
        setWeightInput('');
        setMeals([]);
        setFocusedMealId(null);
        setSelectedMeal(null);
        setMealPlanStatus('loading');
        setMealPlanError(null);
        setDailyLogStatus('loading');
        setDailyLogError(null);
        setIsAddingWater(false);
        setIsUndoingWater(false);
    }, [updateWaterDateKey, userId]);

    useEffect(() => () => {
        isMountedRef.current = false;
        planRequestSequenceRef.current += 1;
        inFlightPlanRequestsRef.current.clear();
        profileRequestSequenceRef.current += 1;
        waterLoadSequenceRef.current += 1;
        waterMutationSequenceRef.current += 1;
        waterMutationRef.current = null;
    }, []);

    const loadTodayMeals = useCallback((now = new Date(), { retry = false, force = false } = {}) => {
        const planDate = toLocalDateKey(now);
        const existingRequest = inFlightPlanRequestsRef.current.get(planDate);
        if (existingRequest && !force) return existingRequest;

        const requestSequence = planRequestSequenceRef.current + 1;
        planRequestSequenceRef.current = requestSequence;
        const requestGeneration = sessionGenerationRef.current;
        if (isMountedRef.current) {
            setMealPlanStatus(retry ? 'retrying' : 'loading');
            setMealPlanError(null);
            setMeals([]);
            setFocusedMealId(null);
        }

        const request = getDailyMealPlan(planDate)
            .then((result) => {
                if (!isMountedRef.current || sessionGenerationRef.current !== requestGeneration
                    || planRequestSequenceRef.current !== requestSequence) return result;

                hydrateCompletedMeals(result.meals);
                setMeals(result.meals);
                setSelectedMeal((currentMeal) => (
                    currentMeal
                        ? result.meals.find((meal) => meal.id === currentMeal.id) || null
                        : null
                ));
                setMealPlanStatus(result.status);
                return result;
            })
            .catch((error) => {
                if (!isMountedRef.current || sessionGenerationRef.current !== requestGeneration
                    || planRequestSequenceRef.current !== requestSequence) return null;

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

    const loadWaterIntake = useCallback(async ({
        now = new Date(),
        retry = false,
        allowDuringMutation = false,
    } = {}) => {
        if (!isMountedRef.current) return { ok: false, stale: true };
        if (waterMutationRef.current && !allowDuringMutation) return { ok: false, busy: true };

        const dateKey = toLocalDateKey(now);
        const requestSequence = waterLoadSequenceRef.current + 1;
        waterLoadSequenceRef.current = requestSequence;
        const requestGeneration = sessionGenerationRef.current;
        const previousDateKey = waterDateKeyRef.current;
        if (previousDateKey !== dateKey) setWater(0);
        updateWaterDateKey(dateKey);
        setDailyLogStatus(retry ? 'retrying' : 'loading');
        setDailyLogError(null);

        const isCurrentRequest = () => isMountedRef.current && isWaterLoadCurrentContract({
            requestGeneration,
            currentGeneration: sessionGenerationRef.current,
            requestSequence,
            currentSequence: waterLoadSequenceRef.current,
            requestDateKey: dateKey,
            activeDateKey: waterDateKeyRef.current,
        });

        try {
            const log = await getDailyLog(dateKey);
            if (!isCurrentRequest()) return { ok: false, stale: true, dateKey };

            const normalizedWater = normalizePersistedWaterLiters(log?.water_intake);
            if (Number.isNaN(normalizedWater)) {
                setWater(0);
                setDailyLogStatus('error');
                setDailyLogError(INVALID_PERSISTED_WATER_MESSAGE);
                return { ok: false, invalid: true, dateKey };
            }

            const nextWater = normalizedWater ?? 0;
            const nextStatus = normalizedWater === null ? 'empty' : 'ready';
            setWater(nextWater);
            setDailyLogStatus(nextStatus);
            setDailyLogError(null);
            return { ok: true, dateKey, water: nextWater, status: nextStatus, error: null };
        } catch (error) {
            if (!isCurrentRequest()) return { ok: false, stale: true, dateKey };
            setWater(0);
            setDailyLogStatus('error');
            setDailyLogError(error?.message || 'Günlük kayıt bilgileri yüklenemedi.');
            return { ok: false, dateKey, error };
        }
    }, [updateWaterDateKey]);

    const retryDailyLog = useCallback(() => loadWaterIntake({ retry: true }), [loadWaterIntake]);

    useFocusEffect(
        useCallback(() => {
            setDailyQuote(getDailyQuote());

            const profileRequestGeneration = sessionGenerationRef.current;
            const profileRequestSequence = profileRequestSequenceRef.current + 1;
            profileRequestSequenceRef.current = profileRequestSequence;
            const isCurrentProfileRequest = () => isMountedRef.current
                && sessionGenerationRef.current === profileRequestGeneration
                && profileRequestSequenceRef.current === profileRequestSequence;

            const loadProfile = async () => {
                try {
                    const profile = await getClientProfile();
                    if (!isCurrentProfileRequest()) return;
                    const fullName = profile?.fullName?.trim();
                    if (fullName) setUserName(fullName.split(' ')[0]);
                    setAvatarUrl(profile?.avatarUrl || null);
                    setWaterTargetLiters(normalizeWaterTargetLitersFromMl(profile?.dailyWaterGoalMl));
                    if (profile?.currentWeight !== null && profile?.currentWeight !== undefined) {
                        setWeight(profile.currentWeight);
                        setWeightInput(String(profile.currentWeight));
                    }
                } catch (error) {
                    if (!isCurrentProfileRequest()) return;
                    console.error('Failed to load dashboard profile:', error);
                }
            };

            refreshConnectionStatus();
            loadProfile();
            const focusNow = new Date();
            loadWaterIntake({ now: focusNow });
            loadTodayMeals();

            const appStateSubscription = AppState.addEventListener('change', (nextState) => {
                if (nextState !== 'active') return;
                const now = new Date();
                const dateKey = toLocalDateKey(now);
                if (waterDateKeyRef.current !== dateKey) loadWaterIntake({ now });
            });

            return () => {
                appStateSubscription.remove();
                profileRequestSequenceRef.current += 1;
                planRequestSequenceRef.current += 1;
                inFlightPlanRequestsRef.current.clear();
                waterLoadSequenceRef.current += 1;
            };
        }, [loadTodayMeals, loadWaterIntake, refreshConnectionStatus]),
    );

    const waterProgress = getWaterProgress(water, waterTargetLiters);
    const firstIncompleteMeal = useMemo(() => getNextIncompleteMeal(meals), [meals]);
    const nutrition = useMemo(() => buildNutritionSummary(meals), [meals]);
    const displayedMeal = (
        (focusedMealId && meals.find((meal) => meal.id === focusedMealId))
        || firstIncompleteMeal
    );
    const isMealCompleted = !!displayedMeal?.isEaten;
    const displayedCompletion = displayedMeal?.id
        ? completedMeals[displayedMeal.id] || null
        : null;

    const runWaterMutation = async (direction, amountMl) => {
        if (waterMutationRef.current) return;
        if (['loading', 'retrying', 'error'].includes(dailyLogStatus)) return;

        const parsedAmountMl = parseWaterInputMl(amountMl ?? waterInput);
        if (parsedAmountMl === null) {
            Alert.alert('Hata', WATER_INPUT_VALIDATION_MESSAGE);
            return;
        }

        const mutationStart = new Date();
        const mutationDateKey = toLocalDateKey(mutationStart);
        const mutationId = waterMutationSequenceRef.current + 1;
        waterMutationSequenceRef.current = mutationId;
        const mutationGeneration = sessionGenerationRef.current;
        const mutation = {
            id: mutationId,
            direction,
            generation: mutationGeneration,
            dateKey: mutationDateKey,
        };
        waterMutationRef.current = mutation;
        if (direction === 'add') setIsAddingWater(true);
        else setIsUndoingWater(true);

        let rollbackState = null;
        const isCurrentMutation = () => isMountedRef.current && isWaterMutationCurrentContract({
            mutationGeneration,
            currentGeneration: sessionGenerationRef.current,
            mutationId,
            activeMutationId: waterMutationRef.current?.id,
            mutationDateKey,
            activeDateKey: waterDateKeyRef.current,
        });

        try {
            if (waterDateKeyRef.current !== mutationDateKey
                || dailyLogStatus === 'loading'
                || dailyLogStatus === 'retrying') {
                const resolved = await loadWaterIntake({ now: mutationStart, allowDuringMutation: true });
                if (!resolved?.ok) return;
                rollbackState = {
                    water: resolved.water,
                    status: resolved.status,
                    error: resolved.error,
                    dateKey: resolved.dateKey,
                };
            } else {
                const normalizedCurrentWater = normalizePersistedWaterLiters(water);
                if (Number.isNaN(normalizedCurrentWater)) {
                    if (isCurrentMutation()) {
                        setWater(0);
                        updateWaterDateKey(mutationDateKey);
                        setDailyLogStatus('error');
                        setDailyLogError(INVALID_PERSISTED_WATER_MESSAGE);
                    }
                    return;
                }
                rollbackState = {
                    water: normalizedCurrentWater ?? 0,
                    status: dailyLogStatus,
                    error: dailyLogError,
                    dateKey: waterDateKeyRef.current,
                };
            }

            if (!isCurrentMutation() || waterDateKeyRef.current !== mutationDateKey) return;

            const nextWater = direction === 'add'
                ? addWaterLiters(rollbackState.water, parsedAmountMl)
                : removeWaterLiters(rollbackState.water, parsedAmountMl);
            if (!Number.isFinite(nextWater) || nextWater < 0) {
                setWater(0);
                updateWaterDateKey(mutationDateKey);
                setDailyLogStatus('error');
                setDailyLogError(INVALID_PERSISTED_WATER_MESSAGE);
                return;
            }

            // Invalidate any load that started before this optimistic mutation.
            waterLoadSequenceRef.current += 1;
            setWater(nextWater);
            updateWaterDateKey(mutationDateKey);
            setDailyLogStatus('ready');
            setDailyLogError(null);

            const persistedWater = await upsertWaterIntake(mutationDateKey, nextWater);
            const canonicalWater = normalizePersistedWaterLiters(persistedWater);
            if (canonicalWater === null || Number.isNaN(canonicalWater)) {
                throw new Error(INVALID_PERSISTED_WATER_MESSAGE);
            }
            if (!isCurrentMutation()) return;

            setWater(canonicalWater);
            updateWaterDateKey(mutationDateKey);
            setDailyLogStatus('ready');
            setDailyLogError(null);
        } catch (error) {
            if (!isCurrentMutation()) return;
            if (rollbackState) {
                setWater(rollbackState.water);
                updateWaterDateKey(rollbackState.dateKey);
                setDailyLogStatus(rollbackState.status);
                setDailyLogError(rollbackState.error);
            }
            Alert.alert('Hata', 'Su miktarı kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            if (waterMutationRef.current?.id !== mutationId) return;
            waterMutationRef.current = null;
            if (!isMountedRef.current || sessionGenerationRef.current !== mutationGeneration) return;
            if (direction === 'add') setIsAddingWater(false);
            else setIsUndoingWater(false);

            const currentDateKey = toLocalDateKey();
            if (currentDateKey !== waterDateKeyRef.current) loadWaterIntake({ now: new Date() });
        }
    };

    const addWater = (amountMl) => runWaterMutation('add', amountMl);

    const removeWater = (amountMl) => runWaterMutation('remove', amountMl);

    const completeMealById = async (mealId, completionPhotoSource = null) => {
        const targetMeal = meals.find((meal) => meal.id === mealId);
        if (!targetMeal?.id) {
            Alert.alert('Hata', 'Geçerli öğün ID bulunamadı.');
            return;
        }

        if (mealMutationsRef.current.has(mealId)) return;
        const previousIsEaten = !!targetMeal.isEaten;
        const previousMeal = targetMeal;
        const nextIsEaten = !previousIsEaten;
        const requestVersion = (mealRequestVersionsRef.current[mealId] || 0) + 1;
        mealRequestVersionsRef.current[mealId] = requestVersion;
        mealMutationsRef.current.add(mealId);
        setUpdatingMealId(mealId);
        setMeals((currentMeals) => currentMeals.map((meal) => (
            meal.id === mealId
                ? { ...meal, isEaten: nextIsEaten, completionPhotoPath: null }
                : meal
        )));
        setFocusedMealId(mealId);

        try {
            const updatedMeal = await toggleMealCompletion(mealId, {
                completed: nextIsEaten,
                completionPhotoSource: nextIsEaten ? completionPhotoSource : null,
            });
            if (mealRequestVersionsRef.current[mealId] !== requestVersion) return;

            setMeals((currentMeals) => currentMeals.map((meal) => (
                meal.id === mealId
                    ? {
                        ...meal,
                        isEaten: updatedMeal?.isEaten ?? nextIsEaten,
                        completionPhotoPath: updatedMeal?.completionPhotoPath || null,
                    }
                    : meal
            )));
        } catch (error) {
            if (mealRequestVersionsRef.current[mealId] === requestVersion) {
                setMeals((currentMeals) => currentMeals.map((meal) => (
                    meal.id === mealId ? previousMeal : meal
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

    const completeMeal = async (completionPhotoSource = null) => {
        if (!displayedMeal?.id) {
            Alert.alert('Hata', 'Geçerli öğün ID bulunamadı.');
            return;
        }
        await completeMealById(displayedMeal.id, completionPhotoSource);
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
        if (!pendingRequest?.id || connectionAction) return;
        try {
            await approvePendingRequest(pendingRequest.id);
            Alert.alert('Başarılı', 'Diyetisyen bağlantınız oluşturuldu.');
            await loadTodayMeals(new Date(), { force: true });
        } catch (error) {
            Alert.alert('Hata', error.message || 'Bağlantı isteği kabul edilemedi. Lütfen tekrar deneyin.');
        }
    };

    const rejectDietitianRequest = async () => {
        if (!pendingRequest?.id || connectionAction) return;
        try {
            await rejectPendingRequest(pendingRequest.id);
            setMeals([]);
            setMealPlanStatus('unlinked');
            Alert.alert('Bilgi', 'Bağlantı isteği reddedildi.');
        } catch (error) {
            Alert.alert('Hata', error.message || 'Bağlantı isteği reddedilemedi. Lütfen tekrar deneyin.');
        }
    };

    const handleRejectDietitianRequest = () => {
        if (!pendingRequest?.id || connectionAction) return;
        Alert.alert(
            'Bağlantı isteğini reddet',
            'Bu diyetisyenin bağlantı isteğini reddetmek istediğinize emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'İsteği Reddet', style: 'destructive', onPress: rejectDietitianRequest },
            ],
        );
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
        waterTargetLiters,
        waterInput,
        setWaterInput,
        waterDateKey,
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
        displayedCompletion,
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
