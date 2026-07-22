import { supabase } from '../../../lib/supabaseClient';
import {
    CONNECTION_REQUIRED_MESSAGE,
    getActiveDietitianConnection,
} from '../../dietitianConnection/services/dietitianConnectionService';
import { saveCurrentWeight } from '../../clients/services/clientService';

const getAuthorizedAnalyticsClientId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const relation = await getActiveDietitianConnection(user.id);
    return relation ? user.id : null;
};

const getWeightHistory = async (clientId) => {
    const { data, error } = await supabase
        .from('measurements')
        .select('measured_at, weight')
        .eq('client_id', clientId)
        .not('weight', 'is', null)
        .order('measured_at', { ascending: false })
        .limit(5);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Sort ascending to get chronological order
    data.reverse();

    return data.map((log, index) => {
        const dateObj = new Date(log.measured_at);
        const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
        const dateLabel = `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;
        return {
            week: (index + 1).toString(),
            dateLabel,
            weight: log.weight
        };
    });
};

const fetchMeasurements = async (clientId) => {
    const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching measurements:", error);
        throw error;
    }

    if (!data) return [];

    const mapping = [
        { key: 'waist', label: 'Bel', detail: '' },
        { key: 'hip', label: 'Kalça', detail: '' },
        { key: 'right_arm', label: 'Sağ kol', detail: '' },
        { key: 'left_arm', label: 'Sol kol', detail: '' },
        { key: 'chest', label: 'Göğüs', detail: '' },
        { key: 'right_calf', label: 'Sağ baldır', detail: '' },
        { key: 'left_calf', label: 'Sol baldır', detail: '' },
        { key: 'neck', label: 'Boyun', detail: '' },
        { key: 'arm', label: 'Önceki kol ölçümü', detail: '' },
        { key: 'calf', label: 'Önceki baldır ölçümü', detail: '' },
    ];

    return mapping.filter(m => data[m.key] != null).map(m => ({
        key: m.key,
        label: m.label,
        value: data[m.key]?.toString(),
        unit: 'cm',
        change: '', // Cannot easily compute change without historical data
        detail: m.detail,
    }));
};

const MEASUREMENT_HISTORY_MAPPING = [
    { key: 'waist', label: 'Bel' },
    { key: 'hip', label: 'Kalça' },
    { key: 'right_arm', label: 'Sağ kol' },
    { key: 'left_arm', label: 'Sol kol' },
    { key: 'chest', label: 'Göğüs' },
    { key: 'right_calf', label: 'Sağ baldır' },
    { key: 'left_calf', label: 'Sol baldır' },
    { key: 'neck', label: 'Boyun' },
];

export const getMeasurementHistory = async () => {
    const clientId = await getAuthorizedAnalyticsClientId();
    if (!clientId) return [];

    const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', clientId)
        .order('measured_at', { ascending: false })
        .limit(100);
    if (error) throw error;

    return (data || []).map((record) => ({
        id: record.id,
        measuredAt: record.measured_at,
        values: MEASUREMENT_HISTORY_MAPPING
            .filter((measurement) => record[measurement.key] !== null && record[measurement.key] !== undefined)
            .map((measurement) => ({ label: measurement.label, value: record[measurement.key] })),
    })).filter((record) => record.values.length > 0);
};

export const saveAnalyticsWeight = async (weight) => saveCurrentWeight(weight);

const validateMeasurementData = (data) => {
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null && (!Number.isFinite(value) || value < 0)) {
            throw new Error(`Geçersiz ölçüm değeri: ${key}`);
        }
    }
};

export const saveBodyMeasurements = async (measurementData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Aksiyon için oturum açmalısınız.");

    if (!(await getActiveDietitianConnection(user.id))) throw new Error(CONNECTION_REQUIRED_MESSAGE);

    validateMeasurementData(measurementData);

    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Safely check if an entry exists for today
    const { data: existing, error: findError } = await supabase
        .from('measurements')
        .select('id')
        .eq('client_id', user.id)
        .eq('measured_at', dateStr)
        .maybeSingle();

    if (findError) throw findError;

    if (existing) {
        const { data, error } = await supabase
            .from('measurements')
            .update(measurementData)
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        const { data, error } = await supabase
            .from('measurements')
            .insert({
                client_id: user.id,
                measured_at: dateStr,
                ...measurementData
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

const getWaterHistory = async (clientId) => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startStr = formatDate(sevenDaysAgo);
    const endStr = formatDate(today);

    const { data, error } = await supabase
        .from('daily_logs')
        .select('date, water_intake')
        .eq('client_id', clientId)
        .not('water_intake', 'is', null)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

    if (error) {
        console.error("Error fetching water history:", error);
        throw error;
    }
    if (!data || data.length === 0) return [];

    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    return data.map((log) => {
        const [year, month, day] = log.date.split('-').map(Number);
        const localDate = new Date(year, month - 1, day);
        return {
            dateKey: log.date,
            day: days[localDate.getDay()],
            amount: Number(log.water_intake),
        };
    });
};

const getBadges = async () => {
    // Persisted badge data is not available in the current MVP contract.
    return [];
};

export const getAnalyticsOverview = async () => {
    const clientId = await getAuthorizedAnalyticsClientId();
    if (!clientId) {
        return {
            weights: [],
            measurements: [],
            waterHistory: [],
            badges: [],
        };
    }

    const [weights, measurements, waterHistory, badges] = await Promise.all([
        getWeightHistory(clientId),
        fetchMeasurements(clientId),
        getWaterHistory(clientId),
        getBadges(),
    ]);

    return { weights, measurements, waterHistory, badges };
};
