import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getDayOptions, getDateFromWeekIndex } from '../../../config/dietData';
import { useMeals } from '../../meals/context/MealsContext'; 
import { submitMealChangeRequest } from '../services/mealChangeRequestService';
import { getDailyMeals } from '../services/mealService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
} from '../../dietitianConnection/services/dietitianConnectionService';

export const useMealsViewModel = () => {
    const dayOptions = useMemo(() => getDayOptions() ?? [], []);
    const [selectedDay, setSelectedDay] = useState(() => {
        const currentDayIndex = new Date().getDay();
        return (currentDayIndex + 6) % 7;
    });
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [groceryModalVisible, setGroceryModalVisible] = useState(false);
    const [groceryItems, setGroceryItems] = useState([]);
    const [photoPreviewUri, setPhotoPreviewUri] = useState(null);
    const [mealsList, setMealsList] = useState([]); 
    const [isLoadingMeals, setIsLoadingMeals] = useState(false);
    const { completedMeals, hydrateCompletedMeals } = useMeals();
    const {
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        refreshConnectionStatus,
    } = useDietitianConnection();

    useFocusEffect(
        useCallback(() => {
            refreshConnectionStatus();
        }, [refreshConnectionStatus])
    );

    useEffect(() => {
        const fetchPlan = async () => {
            if (isLoadingConnection) return;
            if (!hasActiveDietitian) {
                setMealsList([]);
                setIsLoadingMeals(false);
                return;
            }

            setIsLoadingMeals(true);
            try {
                const plan_date = getDateFromWeekIndex(selectedDay);
                const fetchedMeals = await getDailyMeals(plan_date);
                hydrateCompletedMeals(fetchedMeals);
                setMealsList(fetchedMeals);
            } catch (error) {
                console.error("Error fetching daily meals in viewmodel:", error);
            } finally {
                setIsLoadingMeals(false);
            }
        };
        fetchPlan();
    }, [selectedDay, hydrateCompletedMeals, hasActiveDietitian, isLoadingConnection]);

    // Request Modal State
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
        setRequestSelectedMeals((prev) => {
            if (prev.includes(mealType)) {
                return prev.filter((t) => t !== mealType);
            }
            return [...prev, mealType];
        });
    };

    const handleSendRequest = async () => {
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

        try {
            const plan_date = getDateFromWeekIndex(requestSelectedDay);
            
            await submitMealChangeRequest({
                plan_date,
                meal_slot: requestSelectedMeals[0] || 'all', // Simplify if multiple are selected, or assume primary slot. Let's just pass all as array or first one if slot is string. Oh wait, 'meal_slot' is text. Let's join or just use first. New schema: meal_slot (text).
                requested_meals: { alternatives: requestSelectedMeals },
                notes: requestMessage
            });
            Alert.alert('Başarılı', 'Öğün değişikliği talebiniz diyetisyeninize iletildi.');
            setRequestModalVisible(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Hata', error.message || CONNECTION_GENERIC_ERROR_MESSAGE);
        }
    };

    const handleRequestDayChange = (index) => {
        if (requestSelectedMeals.length > 0 || requestMessage.trim().length > 0) {
            Alert.alert(
                'Tamamlanmamış Talep',
                'Başka bir güne geçmeden önce lütfen mevcut gün için talebinizi gönderin veya temizleyin.',
                [{ text: 'Tamam', style: 'cancel' }]
            );
            return;
        }
        setRequestSelectedDay(index);
    };

    const openMealModal = (meal) => setSelectedMeal(meal);
    const closeMealModal = () => setSelectedMeal(null);

    const openPhotoPreview = (uri) => setPhotoPreviewUri(uri);
    const closePhotoPreview = () => setPhotoPreviewUri(null);

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
        const items = buildGroceryItems();
        setGroceryItems(items);
        setGroceryModalVisible(true);
    };

    const toggleGroceryItem = (name) => {
        setGroceryItems((prev) =>
            prev.map((item) => (item.name === name ? { ...item, checked: !item.checked } : item)),
        );
    };

    const getMealIconConfig = (type) => {
        const value = (type || '').toLowerCase();

        if (value.includes('breakfast')) {
            return { name: 'sunny-outline', background: '#FEF3C7', color: '#F59E0B' };
        }
        if (value.includes('lunch')) {
            return { name: 'fast-food-outline', background: '#DBEAFE', color: '#1D4ED8' };
        }
        if (value.includes('dinner')) {
            return { name: 'moon-outline', background: '#EDE9FE', color: '#6D28D9' };
        }
        if (value.includes('snack')) {
            return { name: 'nutrition-outline', background: '#FFE4E6', color: '#DB2777' };
        }

        return { name: 'restaurant-outline', background: '#E6F4EC', color: '#15803D' };
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
        openMealModal,
        closeMealModal,
        openPhotoPreview,
        closePhotoPreview,
        handleGenerateGroceryList,
        toggleGroceryItem,
        getMealIconConfig,
        meals: mealsList, // Returning fetched array as `meals` for backward compat in screen UI
        isLoadingMeals,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        connectionRequiredMessage: CONNECTION_REQUIRED_MESSAGE
    };
};
