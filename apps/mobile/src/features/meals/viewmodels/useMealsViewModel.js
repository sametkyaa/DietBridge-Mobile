import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLocalWeekDateKey, getLocalWeekDayOptions } from '../../../shared/utils/localDate';
import { useMeals } from '../../meals/context/MealsContext';
import { submitMealChangeRequest } from '../services/mealChangeRequestService';
import { getDailyMealPlan } from '../services/mealService';
import {
    createRealtimeRefreshScheduler,
    getMealPlanRealtimeClientId,
    isMealEventRelevant,
    isMealPlanEventRelevant,
    subscribeMealPlanChanges,
} from '../services/mealPlanRealtimeService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
} from '../../dietitianConnection/services/dietitianConnectionService';

const REALTIME_REFRESH_DEBOUNCE_MS = 350;

export const useMealsViewModel = () => {
    const dayOptions = useMemo(() => getLocalWeekDayOptions(), []);
    const [selectedDay, setSelectedDay] = useState(() => {
        const istanbulNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
        return (istanbulNow.getDay() + 6) % 7;
    });
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [groceryModalVisible, setGroceryModalVisible] = useState(false);
    const [groceryItems, setGroceryItems] = useState([]);
    const [photoPreviewUri, setPhotoPreviewUri] = useState(null);
    const [mealsList, setMealsList] = useState([]);
    const [mealPlanStatus, setMealPlanStatus] = useState('loading');
    const [mealPlanError, setMealPlanError] = useState(null);
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const { completedMeals, hydrateCompletedMeals } = useMeals();
    const requestSequenceRef = useRef(0);
    const inFlightRequestsRef = useRef(new Map());
    const isMountedRef = useRef(true);
    const requestSubmissionRef = useRef(false);
    const selectedPlanDateRef = useRef('');
    const knownPlanIdsRef = useRef(new Set());
    const hasCompletedInitialLoadRef = useRef(false);
    const isFocusedRef = useRef(false);
    const loadMealPlanRef = useRef(null);
    const unsubscribeRealtimeRef = useRef(null);
    const refreshSchedulerRef = useRef(null);
    const {
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        refreshConnectionStatus,
    } = useDietitianConnection();

    if (!refreshSchedulerRef.current) {
        // Single debounced funnel for realtime events, focus and AppState
        // fallbacks. Always refreshes through the canonical loader with the
        // latest selected date, so no parallel meal fetch flow exists.
        refreshSchedulerRef.current = createRealtimeRefreshScheduler({
            delayMs: REALTIME_REFRESH_DEBOUNCE_MS,
            onRefresh: () => {
                if (!isMountedRef.current || !loadMealPlanRef.current) return null;
                return loadMealPlanRef.current(selectedPlanDateRef.current, { silent: true, force: true });
            },
        });
    }

    useEffect(() => () => {
        isMountedRef.current = false;
        requestSequenceRef.current += 1;
        if (unsubscribeRealtimeRef.current) {
            unsubscribeRealtimeRef.current();
            unsubscribeRealtimeRef.current = null;
        }
        refreshSchedulerRef.current?.dispose();
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshConnectionStatus();
        }, [refreshConnectionStatus]),
    );

    const loadMealPlan = useCallback((planDate, { retry = false, force = false, silent = false } = {}) => {
        const existingRequest = inFlightRequestsRef.current.get(planDate);
        if (existingRequest && !force) return existingRequest;

        const requestSequence = requestSequenceRef.current + 1;
        requestSequenceRef.current = requestSequence;
        if (isMountedRef.current && !silent) {
            setMealPlanStatus(retry ? 'retrying' : 'loading');
            setMealPlanError(null);
            setMealsList([]);
        }

        const request = getDailyMealPlan(planDate)
            .then((result) => {
                if (!isMountedRef.current || requestSequenceRef.current !== requestSequence) return result;

                hasCompletedInitialLoadRef.current = true;
                knownPlanIdsRef.current = new Set(result?.plan?.id ? [result.plan.id] : []);
                hydrateCompletedMeals(result.meals);
                setMealsList(result.meals);
                setSelectedMeal((currentMeal) => (
                    currentMeal
                        ? result.meals.find((meal) => meal.id === currentMeal.id) || null
                        : null
                ));
                setMealPlanStatus(result.status);
                if (silent) setMealPlanError(null);
                return result;
            })
            .catch((error) => {
                if (!isMountedRef.current || requestSequenceRef.current !== requestSequence) return null;

                if (silent) {
                    // Silent refresh failures keep the current plan on screen;
                    // the next realtime event or focus refetch retries.
                    if (__DEV__) {
                        console.warn('Silent meal plan refresh failed.', { planDate });
                    }
                    return null;
                }

                hasCompletedInitialLoadRef.current = true;
                setMealsList([]);
                setMealPlanStatus('error');
                setMealPlanError(error?.message || CONNECTION_GENERIC_ERROR_MESSAGE);
                return null;
            })
            .finally(() => {
                if (inFlightRequestsRef.current.get(planDate) === request) {
                    inFlightRequestsRef.current.delete(planDate);
                }
            });

        inFlightRequestsRef.current.set(planDate, request);
        return request;
    }, [hydrateCompletedMeals]);

    const selectedPlanDate = getLocalWeekDateKey(selectedDay);
    selectedPlanDateRef.current = selectedPlanDate;
    loadMealPlanRef.current = loadMealPlan;

    useEffect(() => {
        loadMealPlan(selectedPlanDate);
    }, [loadMealPlan, selectedPlanDate]);

    // Realtime subscription scoped to screen focus: created when the client
    // session and user id are ready, removed on blur/unmount/logout.
    useFocusEffect(
        useCallback(() => {
            isFocusedRef.current = true;
            let disposed = false;

            const handleRealtimeChange = ({ table, payload }) => {
                const relevant = table === 'meal_plans'
                    ? isMealPlanEventRelevant(payload, selectedPlanDateRef.current)
                    : isMealEventRelevant(payload, knownPlanIdsRef.current);

                if (relevant) {
                    refreshSchedulerRef.current?.notify();
                }
            };

            getMealPlanRealtimeClientId()
                .then((clientId) => {
                    if (disposed || !clientId || !isMountedRef.current) return;
                    unsubscribeRealtimeRef.current?.();
                    unsubscribeRealtimeRef.current = subscribeMealPlanChanges({
                        clientId,
                        onChange: handleRealtimeChange,
                    });
                })
                .catch(() => undefined);

            // Focus fallback: silently revalidate when returning to a screen
            // whose initial load already finished. Debounce merges this with
            // a simultaneous AppState resume signal.
            if (hasCompletedInitialLoadRef.current) {
                refreshSchedulerRef.current?.notify();
            }

            return () => {
                disposed = true;
                isFocusedRef.current = false;
                refreshSchedulerRef.current?.clearPending();
                if (unsubscribeRealtimeRef.current) {
                    unsubscribeRealtimeRef.current();
                    unsubscribeRealtimeRef.current = null;
                }
            };
        }, []),
    );

    // AppState fallback: the OS can suspend the realtime socket in background,
    // so resume revalidates the plan once the app returns to foreground.
    useEffect(() => {
        const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
            if (nextAppState === 'active' && isFocusedRef.current && hasCompletedInitialLoadRef.current) {
                refreshSchedulerRef.current?.notify();
            }
        });

        return () => appStateSubscription.remove();
    }, []);

    const retryMeals = useCallback(() => (
        loadMealPlan(selectedPlanDate, { retry: true, force: true })
    ), [loadMealPlan, selectedPlanDate]);

    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requestSelectedDay, setRequestSelectedDay] = useState(0);
    const [requestSelectedMeals, setRequestSelectedMeals] = useState([]);
    const [requestMessage, setRequestMessage] = useState('');
    const [requestMeals, setRequestMeals] = useState([]);
    const [requestMealsStatus, setRequestMealsStatus] = useState('idle');
    const [requestMealsError, setRequestMealsError] = useState(null);
    const requestMealsSequenceRef = useRef(0);

    // Loads the meals of the day selected inside the change-request sheet.
    // A dedicated sequence guard keeps a late response for a previously
    // selected day from overwriting the current day's meal list.
    const loadRequestMeals = useCallback((dayIndex, { retry = false } = {}) => {
        const planDate = getLocalWeekDateKey(dayIndex);
        const requestSequence = requestMealsSequenceRef.current + 1;
        requestMealsSequenceRef.current = requestSequence;

        if (isMountedRef.current) {
            setRequestMealsStatus(retry ? 'retrying' : 'loading');
            setRequestMealsError(null);
            setRequestMeals([]);
        }

        return getDailyMealPlan(planDate)
            .then((result) => {
                if (!isMountedRef.current || requestMealsSequenceRef.current !== requestSequence) return result;
                setRequestMeals(result.meals);
                setRequestMealsStatus(result.status === 'unlinked' ? 'empty' : result.status);
                return result;
            })
            .catch((error) => {
                if (!isMountedRef.current || requestMealsSequenceRef.current !== requestSequence) return null;
                setRequestMeals([]);
                setRequestMealsStatus('error');
                setRequestMealsError(error?.message || CONNECTION_GENERIC_ERROR_MESSAGE);
                return null;
            });
    }, []);

    const retryRequestMeals = useCallback(() => (
        loadRequestMeals(requestSelectedDay, { retry: true })
    ), [loadRequestMeals, requestSelectedDay]);

    const handleOpenRequestModal = () => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', CONNECTION_REQUIRED_MESSAGE);
            return;
        }
        setRequestSelectedDay(selectedDay);
        setRequestSelectedMeals([]);
        setRequestMessage('');
        setRequestModalVisible(true);
        loadRequestMeals(selectedDay);
    };

    const handleToggleRequestMeal = (mealType) => {
        setRequestSelectedMeals((previous) => (
            previous.includes(mealType)
                ? previous.filter((type) => type !== mealType)
                : [...previous, mealType]
        ));
    };

    const handleSendRequest = async () => {
        if (requestSubmissionRef.current) return;
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', CONNECTION_REQUIRED_MESSAGE);
            return;
        }
        if (requestSelectedMeals.length === 0) {
            Alert.alert('Uyarı', 'Lütfen en az bir öğün seçiniz.');
            return;
        }
        if (!requestMessage.trim()) {
            Alert.alert('Uyarı', 'Lütfen bir mesaj veya talep yazınız.');
            return;
        }

        requestSubmissionRef.current = true;
        setIsSendingRequest(true);
        try {
            await submitMealChangeRequest({
                plan_date: getLocalWeekDateKey(requestSelectedDay),
                meal_slot: requestSelectedMeals[0] || 'all',
                requested_meals: { alternatives: requestSelectedMeals },
                notes: requestMessage,
            });
            Alert.alert('Başarılı', 'Öğün değişikliği talebiniz diyetisyeninize iletildi.');
            setRequestModalVisible(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', error.message || CONNECTION_GENERIC_ERROR_MESSAGE);
        } finally {
            requestSubmissionRef.current = false;
            if (isMountedRef.current) setIsSendingRequest(false);
        }
    };

    const handleRequestDayChange = (index) => {
        if (requestSelectedMeals.length > 0 || requestMessage.trim().length > 0) {
            Alert.alert(
                'Tamamlanmamış Talep',
                'Başka bir güne geçmeden önce lütfen mevcut gün için talebinizi gönderin veya temizleyin.',
                [{ text: 'Tamam', style: 'cancel' }],
            );
            return;
        }
        setRequestSelectedDay(index);
        loadRequestMeals(index);
    };

    const buildGroceryItems = () => {
        const counts = {};
        mealsList.forEach((meal) => {
            meal.ingredients?.forEach((ingredient) => {
                const key = ingredient.trim();
                counts[key] = (counts[key] || 0) + 1;
            });
        });
        return Object.keys(counts).map((name) => ({ name, count: counts[name], checked: false }));
    };

    const handleGenerateGroceryList = () => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', CONNECTION_REQUIRED_MESSAGE);
            return;
        }
        setGroceryItems(buildGroceryItems());
        setGroceryModalVisible(true);
    };

    return {
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
        openMealModal: setSelectedMeal,
        closeMealModal: () => setSelectedMeal(null),
        openPhotoPreview: setPhotoPreviewUri,
        closePhotoPreview: () => setPhotoPreviewUri(null),
        handleGenerateGroceryList,
        toggleGroceryItem: (name) => setGroceryItems((previous) => previous.map((item) => (
            item.name === name ? { ...item, checked: !item.checked } : item
        ))),
        meals: mealsList,
        mealPlanStatus,
        mealPlanError,
        retryMeals,
        isLoadingMeals: mealPlanStatus === 'loading' || mealPlanStatus === 'retrying',
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        connectionRequiredMessage: CONNECTION_REQUIRED_MESSAGE,
        isSendingRequest,
    };
};
