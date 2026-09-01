import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAnalyticsOverview, getMeasurementHistory, saveAnalyticsWeight, saveBodyMeasurements } from '../services/analyticsService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { CONNECTION_REQUIRED_MESSAGE } from '../../dietitianConnection/services/dietitianConnectionService';

const EMPTY_FORM = {
    waistCm: '',
    hipCm: '',
    rightArmCm: '',
    leftArmCm: '',
    chestCm: '',
    rightCalfCm: '',
    leftCalfCm: '',
    neckCm: '',
};

const buildMeasurementForm = (measurements) => {
    const form = { ...EMPTY_FORM };
    measurements.forEach((measurement) => {
        if (measurement.key === 'waist') form.waistCm = measurement.value || '';
        if (measurement.key === 'hip') form.hipCm = measurement.value || '';
        if (measurement.key === 'right_arm') form.rightArmCm = measurement.value || '';
        if (measurement.key === 'left_arm') form.leftArmCm = measurement.value || '';
        if (measurement.key === 'chest') form.chestCm = measurement.value || '';
        if (measurement.key === 'right_calf') form.rightCalfCm = measurement.value || '';
        if (measurement.key === 'left_calf') form.leftCalfCm = measurement.value || '';
        if (measurement.key === 'neck') form.neckCm = measurement.value || '';
    });
    return form;
};

const parseMeasurement = (value) => {
    const normalized = String(value || '').trim().replace(',', '.');
    if (!normalized) return null;
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return Number.NaN;
    const number = Number(normalized);
    return Number.isFinite(number) && number > 0 && number <= 500 ? number : Number.NaN;
};

const parseWeight = (value) => {
    const normalized = String(value || '').trim().replace(',', '.');
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return Number.NaN;
    const number = Number(normalized);
    return Number.isFinite(number) && number >= 20 && number <= 500 ? number : Number.NaN;
};

export const useAnalyticsViewModel = () => {
    const [monthlyWeightTrend, setMonthlyWeightTrend] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [waterHistory, setWaterHistory] = useState([]);
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
    const [analyticsStatus, setAnalyticsStatus] = useState('loading');
    const [analyticsError, setAnalyticsError] = useState(null);
    const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
    const [measurementForm, setMeasurementForm] = useState(EMPTY_FORM);
    const [isSavingMeasurements, setIsSavingMeasurements] = useState(false);
    const [measurementHistory, setMeasurementHistory] = useState([]);
    const [measurementHistoryStatus, setMeasurementHistoryStatus] = useState('idle');
    const [isMeasurementHistoryVisible, setIsMeasurementHistoryVisible] = useState(false);
    const [isAddingWeight, setIsAddingWeight] = useState(false);
    const [weightInput, setWeightInput] = useState('');
    const [isSavingWeight, setIsSavingWeight] = useState(false);
    const isMountedRef = useRef(true);
    const loadSequenceRef = useRef(0);
    const saveMutationRef = useRef(false);
    const historyRequestRef = useRef(false);
    const weightSaveRef = useRef(false);
    const {
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        refreshConnectionStatus,
    } = useDietitianConnection();

    useEffect(() => () => {
        isMountedRef.current = false;
        loadSequenceRef.current += 1;
    }, []);

    const clearAnalyticsData = useCallback(() => {
        setMonthlyWeightTrend([]);
        setMeasurements([]);
        setWaterHistory([]);
        setSelectedWeekIndex(0);
        setMeasurementForm({ ...EMPTY_FORM });
        setMeasurementHistory([]);
        setMeasurementHistoryStatus('idle');
        setIsMeasurementHistoryVisible(false);
        setIsAddingWeight(false);
        setWeightInput('');
        setIsEditingMeasurements(false);
    }, []);

    const loadData = useCallback(async ({ retry = false, showLoading = true } = {}) => {
        const sequence = loadSequenceRef.current + 1;
        loadSequenceRef.current = sequence;
        if (showLoading && isMountedRef.current) {
            setAnalyticsStatus(retry ? 'retrying' : 'loading');
            setAnalyticsError(null);
        }

        try {
            const {
                weights,
                measurements: currentMeasurements,
                waterHistory: currentWaterHistory,
            } = await getAnalyticsOverview();
            if (!isMountedRef.current || loadSequenceRef.current !== sequence) return false;

            setMonthlyWeightTrend(weights);
            setSelectedWeekIndex(weights.length > 0 ? weights.length - 1 : 0);
            setMeasurements(currentMeasurements);
            setMeasurementForm(buildMeasurementForm(currentMeasurements));
            setWaterHistory(currentWaterHistory);
            const hasMeaningfulData = weights.length > 0
                || currentMeasurements.length > 0
                || currentWaterHistory.length > 0;
            setAnalyticsStatus(hasMeaningfulData ? 'ready' : 'empty');
            setAnalyticsError(null);
            return true;
        } catch (error) {
            if (!isMountedRef.current || loadSequenceRef.current !== sequence) return false;
            console.error('Analysis data load error:', error);
            clearAnalyticsData();
            setAnalyticsStatus('error');
            setAnalyticsError('Analiz verileri yüklenemedi. Lütfen tekrar deneyin.');
            return false;
        }
    }, [clearAnalyticsData]);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            setAnalyticsStatus('loading');
            setAnalyticsError(null);

            const refreshAndLoad = async () => {
                const currentConnection = await refreshConnectionStatus();
                if (!isActive || !isMountedRef.current) return;
                if (!currentConnection.hasActiveDietitian) {
                    loadSequenceRef.current += 1;
                    clearAnalyticsData();
                    setAnalyticsStatus('locked');
                    return;
                }
                await loadData();
            };

            refreshAndLoad();
            return () => {
                isActive = false;
                loadSequenceRef.current += 1;
            };
        }, [clearAnalyticsData, loadData, refreshConnectionStatus]),
    );

    const retryAnalytics = useCallback(async () => {
        setAnalyticsStatus('retrying');
        setAnalyticsError(null);
        const currentConnection = await refreshConnectionStatus();
        if (!isMountedRef.current) return;
        if (!currentConnection.hasActiveDietitian) {
            loadSequenceRef.current += 1;
            clearAnalyticsData();
            setAnalyticsStatus('locked');
            return;
        }
        await loadData({ retry: true, showLoading: false });
    }, [clearAnalyticsData, loadData, refreshConnectionStatus]);

    const handleEditMeasurementsToggle = () => {
        if (saveMutationRef.current) return;
        if (!isEditingMeasurements) setMeasurementForm(buildMeasurementForm(measurements));
        setIsEditingMeasurements((current) => !current);
    };

    const handleSaveMeasurements = async () => {
        if (saveMutationRef.current) return;
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', CONNECTION_REQUIRED_MESSAGE);
            return;
        }

        const parsed = {
            waist: parseMeasurement(measurementForm.waistCm),
            hip: parseMeasurement(measurementForm.hipCm),
            right_arm: parseMeasurement(measurementForm.rightArmCm),
            left_arm: parseMeasurement(measurementForm.leftArmCm),
            chest: parseMeasurement(measurementForm.chestCm),
            right_calf: parseMeasurement(measurementForm.rightCalfCm),
            left_calf: parseMeasurement(measurementForm.leftCalfCm),
            neck: parseMeasurement(measurementForm.neckCm),
        };
        const updates = Object.fromEntries(Object.entries(parsed).filter(([, value]) => value !== null));
        if (Object.keys(updates).length === 0) {
            Alert.alert('Uyarı', 'Kaydetmek için en az bir ölçü giriniz.');
            return;
        }
        if (Object.values(updates).some((value) => !Number.isFinite(value))) {
            Alert.alert('Hata', 'Lütfen 0 ile 500 cm arasında geçerli ölçüler giriniz.');
            return;
        }

        saveMutationRef.current = true;
        setIsSavingMeasurements(true);
        try {
            await saveBodyMeasurements(updates);
            const refreshed = await loadData({ showLoading: false });
            if (!isMountedRef.current) return;
            setIsEditingMeasurements(false);
            if (!refreshed) {
                Alert.alert('Bilgi', 'Ölçüler kaydedildi ancak analiz verileri yenilenemedi. Lütfen tekrar deneyin.');
                return;
            }
            Alert.alert('Başarılı', 'Ölçüler kaydedildi.');
        } catch (error) {
            console.error('Ölçü kaydetme hatası', error);
            Alert.alert('Hata', 'Ölçüler kaydedilirken bir sorun oluştu.');
        } finally {
            saveMutationRef.current = false;
            if (isMountedRef.current) setIsSavingMeasurements(false);
        }
    };

    const handleOpenMeasurementHistory = async () => {
        if (historyRequestRef.current) return;
        setIsMeasurementHistoryVisible(true);
        setMeasurementHistoryStatus('loading');
        try {
            historyRequestRef.current = true;
            const history = await getMeasurementHistory();
            if (!isMountedRef.current) return;
            setMeasurementHistory(history);
            setMeasurementHistoryStatus(history.length > 0 ? 'ready' : 'empty');
        } catch (error) {
            console.error('Ölçüm geçmişi yükleme hatası', error);
            if (isMountedRef.current) setMeasurementHistoryStatus('error');
        } finally {
            historyRequestRef.current = false;
        }
    };

    const handleCloseMeasurementHistory = () => {
        setIsMeasurementHistoryVisible(false);
    };

    const handleOpenWeightEntry = () => {
        if (weightSaveRef.current) return;
        setWeightInput(currentWeight === null ? '' : String(currentWeight));
        setIsAddingWeight(true);
    };

    const handleCloseWeightEntry = () => {
        if (!weightSaveRef.current) setIsAddingWeight(false);
    };

    const handleSaveWeight = async () => {
        if (weightSaveRef.current) return;
        const weight = parseWeight(weightInput);
        if (!Number.isFinite(weight)) {
            Alert.alert('Hata', 'Lütfen 20 ile 500 kg arasında geçerli bir kilo giriniz.');
            return;
        }

        weightSaveRef.current = true;
        setIsSavingWeight(true);
        try {
            await saveAnalyticsWeight(weight);
            const refreshed = await loadData({ showLoading: false });
            if (!isMountedRef.current) return;
            if (!refreshed) {
                Alert.alert('Bilgi', 'Kilo kaydedildi ancak analiz verileri yenilenemedi. Lütfen tekrar deneyin.');
                return;
            }
            setIsAddingWeight(false);
            Alert.alert('Başarılı', 'Kilonuz kaydedildi.');
        } catch (error) {
            console.error('Kilo kaydetme hatası', error);
            Alert.alert('Hata', 'Kilonuz kaydedilemedi. Lütfen tekrar deneyin.');
        } finally {
            weightSaveRef.current = false;
            if (isMountedRef.current) setIsSavingWeight(false);
        }
    };

    const weeklyWeightData = monthlyWeightTrend.map((item, index) => {
        const previousWeight = index === 0 ? item.weight : monthlyWeightTrend[index - 1].weight;
        const change = index === 0 ? 0 : item.weight - previousWeight;
        return { ...item, change };
    });
    const changeMagnitudes = weeklyWeightData.map((item) => Math.abs(item.change));
    const maxChangeMagnitude = Math.max(...changeMagnitudes, 1) || 1;
    const currentWeight = weeklyWeightData.length > 0 ? weeklyWeightData[weeklyWeightData.length - 1].weight : null;
    const startWeight = weeklyWeightData.length > 0 ? weeklyWeightData[0].weight : null;
    const weightChange = currentWeight !== null && startWeight !== null ? currentWeight - startWeight : null;
    const totalWater = waterHistory.reduce((total, item) => total + Number(item.amount || 0), 0);

    return {
        weeklyWeightData,
        selectedWeekIndex,
        setSelectedWeekIndex,
        maxChangeMagnitude,
        measurements,
        waterHistory,
        monthLabel: 'Son kayıtlar',
        currentWeight,
        startWeight,
        weightChange,
        totalWater,
        analyticsStatus,
        analyticsError,
        retryAnalytics,
        isEditingMeasurements,
        handleEditMeasurementsToggle,
        measurementForm,
        setMeasurementForm,
        handleSaveMeasurements,
        isSavingMeasurements,
        measurementHistory,
        measurementHistoryStatus,
        isMeasurementHistoryVisible,
        handleOpenMeasurementHistory,
        handleCloseMeasurementHistory,
        isAddingWeight,
        weightInput,
        setWeightInput,
        isSavingWeight,
        handleOpenWeightEntry,
        handleCloseWeightEntry,
        handleSaveWeight,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        connectionRequiredMessage: CONNECTION_REQUIRED_MESSAGE,
    };
};
