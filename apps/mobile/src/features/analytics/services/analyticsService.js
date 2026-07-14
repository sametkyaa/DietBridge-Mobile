import { supabase } from '../../../lib/supabaseClient';
import {
    CONNECTION_REQUIRED_MESSAGE,
    getActiveDietitianConnection,
} from '../../dietitianConnection/services/dietitianConnectionService';

const hasActiveDietitianConnection = async (clientId) => {
    const relation = await getActiveDietitianConnection(clientId);
    return !!relation;
};

export const getWeightHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [{ week: '1', dateLabel: 'Veri Yok', weight: 0 }];
    if (!(await hasActiveDietitianConnection(user.id))) {
        return [{ week: '1', dateLabel: 'Veri Yok', weight: 0 }];
    }

    const { data, error } = await supabase
        .from('measurements')
        .select('measured_at, weight')
        .eq('client_id', user.id)
        .not('weight', 'is', null)
        .order('measured_at', { ascending: false })
        .limit(5);

    if (error || !data || data.length === 0) {
        return [{ week: '1', dateLabel: 'Veri Yok', weight: 0 }];
    }

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

export const fetchMeasurements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    if (!(await hasActiveDietitianConnection(user.id))) return [];

    const { data, error } = await supabase
        .from('measurements')
        .select('*')
        .eq('client_id', user.id)
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("Error fetching measurements:", error);
        return [];
    }

    if (!data) return [];

    const mapping = [
        { key: 'waist', label: 'Bel', detail: '' },
        { key: 'hip', label: 'Kalça', detail: '' },
        { key: 'arm', label: 'Kol', detail: 'Sağ / Sol' },
    ];

    return mapping.filter(m => data[m.key] != null).map(m => ({
        label: m.label,
        value: data[m.key]?.toString(),
        unit: 'cm',
        change: '', // Cannot easily compute change without historical data
        detail: m.detail,
    }));
};

const validateMeasurementData = (data) => {
    const keysToCheck = ['waist', 'hip', 'arm'];
    for (const key of keysToCheck) {
        if (data[key] !== undefined && data[key] !== null && data[key] < 0) {
            throw new Error(`Ölçüm değerleri negatif olamaz: ${key}`);
        }
    }
};

export const saveBodyMeasurements = async (measurementData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Aksiyon için oturum açmalısınız.");

    if (!(await hasActiveDietitianConnection(user.id))) throw new Error(CONNECTION_REQUIRED_MESSAGE);

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

export const getWaterHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    if (!(await hasActiveDietitianConnection(user.id))) return [];

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startStr = formatDate(sevenDaysAgo);
    const endStr = formatDate(today);

    const { data, error } = await supabase
        .from('daily_logs')
        .select('date, water_intake')
        .eq('client_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: true });

    if (error) {
        console.error("Error fetching water history:", error);
        return [];
    }

    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const map = {};
    if (data) {
        data.forEach(log => {
            map[log.date] = log.water_intake || 0;
        });
    }

    const result = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(sevenDaysAgo.getDate() + i);
        const dateStr = formatDate(d);
        result.push({
            day: days[d.getDay()],
            amount: map[dateStr] || 0
        });
    }

    return result;
};

export const getBadges = async () => {
    return [
        { label: 'Su Şampiyonu', icon: '💧', accent: '#E0EDFF' },
        { label: 'İlk 5 Kilo', icon: '🎯', accent: '#F9EFD3' },
        { label: '7 Günlük Seri', icon: '🔥', accent: '#FFE1E2' },
    ];
};
