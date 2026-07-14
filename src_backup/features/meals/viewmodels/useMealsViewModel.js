import { useState, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { useMeals } from '../../../context/MealsContext';
import { getMeals, getDays, sendMealChangeRequest } from '../services/mealsService';

export const useMealsViewModel = () => {
    const dayOptions = useMemo(() => getDays(), []);
    const [selectedDay, setSelectedDay] = useState(0);
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [groceryModalVisible, setGroceryModalVisible] = useState(false);
    const [groceryItems, setGroceryItems] = useState([]);
    const [photoPreviewUri, setPhotoPreviewUri] = useState(null);
    const { completedMeals } = useMeals();
    const [mealsData, setMealsData] = useState([]);

    // Request Modal State
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requestSelectedDay, setRequestSelectedDay] = useState(0);
    const [requestSelectedMeals, setRequestSelectedMeals] = useState([]);
    const [requestMessage, setRequestMessage] = useState('');

    useEffect(() => {
        loadMeals();
    }, []);

    const loadMeals = async () => {
        const data = await getMeals();
        setMealsData(data);
    };

    const handleOpenRequestModal = () => {
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
        if (requestSelectedMeals.length === 0) {
            Alert.alert('Uyarı', 'Lütfen en az bir öğün seçiniz.');
            return;
        }
        if (!requestMessage.trim()) {
            Alert.alert('Uyarı', 'Lütfen bir mesaj veya talep yazınız.');
            return;
        }

        const result = await sendMealChangeRequest({
            day: dayOptions[requestSelectedDay],
            meals: requestSelectedMeals,
            message: requestMessage,
        });

        if (result.success) {
            Alert.alert('Başarılı', result.message);
            setRequestModalVisible(false);
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
        mealsData.forEach((meal) => {
            meal.ingredients?.forEach((ingredient) => {
                const key = ingredient.trim();
                counts[key] = (counts[key] || 0) + 1;
            });
        });
        return Object.keys(counts).map((name) => ({ name, count: counts[name], checked: false }));
    };

    const handleGenerateGroceryList = () => {
        const items = buildGroceryItems();
        setGroceryItems(items);
        setGroceryModalVisible(true);
    };

    const toggleGroceryItem = (name) => {
        setGroceryItems((prev) =>
            prev.map((item) => (item.name === name ? { ...item, checked: !item.checked } : item)),
        );
    };

    return {
        state: {
            dayOptions,
            selectedDay,
            selectedMeal,
            groceryModalVisible,
            groceryItems,
            photoPreviewUri,
            completedMeals,
            mealsData,
            requestModalVisible,
            requestSelectedDay,
            requestSelectedMeals,
            requestMessage,
        },
        actions: {
            setSelectedDay,
            setGroceryModalVisible,
            setGroceryItems,
            setPhotoPreviewUri,
            setRequestModalVisible,
            setRequestSelectedDay,
            setRequestSelectedMeals,
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
        },
    };
};
