import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLocalWeekDateKey, getLocalWeekDayOptions } from '../../../shared/utils/localDate';
import { useMeals } from '../../meals/context/MealsContext';
import { submitMealChangeRequest } from '../services/mealChangeRequestService';
import { getDailyMealPlan } from '../services/mealService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
} from '../../dietitianConnection/services/dietitianConnectionService';

export const useMealsViewModel = () => {
    const dayOptions = useMemo(() => getLocalWeekDayOptions(), []);
    const [selectedDay, setSelectedDay] = useState(() => (new Date().getDay() + 6) % 7);
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
    const {
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        refreshConnectionStatus,
    } = useDietitianConnection();

    useEffect(() => () => {
        isMountedRef.current = false;
        requestSequenceRef.current += 1;
    }, []);

    useFocusEffect(
        useCallback(() => {
            refreshConnectionStatus();
        }, [refreshConnectionStatus]),
    );

    const loadMealPlan = useCallback((planDate, { retry = false, force = false } = {}) => {
        const existingRequest = inFlightRequestsRef.current.get(planDate);
        if (existingRequest && !force) return existingRequest;

        const requestSequence = requestSequenceRef.current + 1;
        requestSequenceRef.current = requestSequence;
        if (isMountedRef.current) {
            setMealPlanStatus(retry ? 'retrying' : 'loading');
            setMealPlanError(null);
            setMealsList([]);
        }

        const request = getDailyMealPlan(planDate)
            .then((result) => {
                if (!isMountedRef.current || requestSequenceRef.current !== requestSequence) return result;

                hydrateCompletedMeals(result.meals);
                setMealsList(result.meals);
                setMealPlanStatus(result.status);
                return result;
            })
            .catch((error) => {
                if (!isMountedRef.current || requestSequenceRef.current !== requestSequence) return null;

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

    useEffect(() => {
        loadMealPlan(selectedPlanDate);
    }, [loadMealPlan, selectedPlanDate]);

    const retryMeals = useCallback(() => (
        loadMealPlan(selectedPlanDate, { retry: true, force: true })
    ), [loadMealPlan, selectedPlanDate]);

    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requestSelectedDay, setRequestSelectedDay] = useState(0);
    const [requestSelectedMeals, setRequestSelectedMeals] = useState([]);
    const [requestMessage, setRequestMessage] = useState('');

    const handleOpenRequestModal = () => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', CONNECTION_REQUIRED_MESSAGE);
            return;
        }
        setRequestSelectedDay(selectedDay);
        setRequestSelectedMeals([]);
        setRequestMessage('');
        setRequestModalVisible(true);
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
