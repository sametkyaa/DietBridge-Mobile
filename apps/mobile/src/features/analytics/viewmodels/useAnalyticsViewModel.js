import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBadges, fetchMeasurements, getWaterHistory, getWeightHistory, saveBodyMeasurements } from '../services/analyticsService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { CONNECTION_REQUIRED_MESSAGE } from '../../dietitianConnection/services/dietitianConnectionService';

export const useAnalyticsViewModel = () => {
    const [monthlyWeightTrend, setMonthlyWeightTrend] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [waterHistory, setWaterHistory] = useState([]);
    const [badges, setBadges] = useState([]);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

    const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
    const [measurementForm, setMeasurementForm] = useState({
        waistCm: '',
        hipCm: '',
        armCm: ''
    });
    const {
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        refreshConnectionStatus,
    } = useDietitianConnection();

    const clearAnalyticsData = useCallback(() => {
        setMonthlyWeightTrend([]);
        setMeasurements([]);
        setWaterHistory([]);
        setBadges([]);
        setSelectedWeekIndex(0);
        setMeasurementForm({ waistCm: '', hipCm: '', armCm: '' });
    }, []);

    const loadData = useCallback(async () => {
        const weights = await getWeightHistory();
        setMonthlyWeightTrend(weights);
        setSelectedWeekIndex(weights.length - 1); // Select last week by default

        const currentMeasurements = await fetchMeasurements();
        setMeasurements(currentMeasurements);
        
        let initialForm = { waistCm: '', hipCm: '', armCm: '' };
        currentMeasurements.forEach(m => {
            if (m.label === 'Bel') initialForm.waistCm = m.value || '';
            if (m.label === 'Kalça') initialForm.hipCm = m.value || '';
            if (m.label === 'Kol') initialForm.armCm = m.value || '';
        });
        setMeasurementForm(initialForm);

        setWaterHistory(await getWaterHistory());
        setBadges(await getBadges());
    }, []);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const refreshAndLoad = async () => {
                const currentConnection = await refreshConnectionStatus();
                if (!isActive) return;

                if (!currentConnection.hasActiveDietitian) {
                    clearAnalyticsData();
                    return;
                }

                try {
                    await loadData();
                } catch (error) {
                    console.error('Analysis data load error:', error);
                    clearAnalyticsData();
                }
            };

            refreshAndLoad();

            return () => {
                isActive = false;
            };
        }, [clearAnalyticsData, loadData, refreshConnectionStatus])
    );

    const handleEditMeasurementsToggle = () => {
        if (!isEditingMeasurements) {
            let initialForm = { waistCm: '', hipCm: '', armCm: '' };
            measurements.forEach(m => {
                if (m.label === 'Bel') initialForm.waistCm = m.value || '';
                if (m.label === 'Kalça') initialForm.hipCm = m.value || '';
                if (m.label === 'Kol') initialForm.armCm = m.value || '';
            });
            setMeasurementForm(initialForm);
        }
        setIsEditingMeasurements(!isEditingMeasurements);
    };

    const handleSaveMeasurements = async () => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', CONNECTION_REQUIRED_MESSAGE);
            return;
        }

        try {
            const updates = {};
            if (measurementForm.waistCm) updates.waist = parseFloat(measurementForm.waistCm);
            if (measurementForm.hipCm) updates.hip = parseFloat(measurementForm.hipCm);
            if (measurementForm.armCm) updates.arm = parseFloat(measurementForm.armCm);

            if (Object.keys(updates).length > 0) {
                await saveBodyMeasurements(updates);
                await loadData(); // Reload constraints
            }
            setIsEditingMeasurements(false);
            Alert.alert("Başarılı", "Ölçüler kaydedildi.");
        } catch (error) {
            console.error("Ölçü kaydetme hatası", error);
            Alert.alert("Hata", "Ölçüler kaydedilirken bir sorun oluştu.");
        }
    };

    const weeklyWeightData = monthlyWeightTrend.map((item, index) => {
        const previousWeight = index === 0 ? item.weight : monthlyWeightTrend[index - 1].weight;
        const change = index === 0 ? 0 : item.weight - previousWeight;
        return { ...item, change };
    });

    const changeMagnitudes = weeklyWeightData.map((item) => Math.abs(item.change));
    const maxChangeMagnitude = Math.max(...changeMagnitudes, 1) || 1;

    const currentWeight = weeklyWeightData.length > 0 ? weeklyWeightData[weeklyWeightData.length - 1].weight : 0;
    const startWeight = weeklyWeightData.length > 0 ? weeklyWeightData[0].weight : 0;
    const weightChange = currentWeight - startWeight;
    
    let totalWater = 0;
    waterHistory.forEach(w => totalWater += w.amount);

    return {
        weeklyWeightData,
        selectedWeekIndex,
        setSelectedWeekIndex,
        maxChangeMagnitude,
        measurements,
        waterHistory,
        badges,
        monthLabel: 'Son Kayıtlar',
        currentWeight,
        startWeight,
        weightChange,
        totalWater,
        isEditingMeasurements,
        handleEditMeasurementsToggle,
        measurementForm,
        setMeasurementForm,
        handleSaveMeasurements,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        connectionRequiredMessage: CONNECTION_REQUIRED_MESSAGE
    };
};
