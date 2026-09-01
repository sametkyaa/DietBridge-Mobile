import { supabase } from '../../../lib/supabaseClient';
import { saveCurrentWeight } from './clientService';
const {
    INVALID_PERSISTED_WATER_MESSAGE,
    normalizePersistedWaterLiters,
} = require('../../../shared/utils/waterTrackingContract.cjs');

export const DAILY_LOG_NETWORK_ERROR_MESSAGE = 'Günlük kayıt bilgilerine ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
export const DAILY_LOG_REQUEST_ERROR_MESSAGE = 'Günlük kayıt bilgileri şu anda yüklenemedi.';
const SESSION_REQUIRED_MESSAGE = 'Kullanıcı oturumu bulunamadı.';

const createDailyLogError = ({ error, status, action = 'load' } = {}) => {
    const rawMessage = String(error?.message || '').trim();
    const isNetworkError = Number(status ?? error?.status) === 0
        || !rawMessage
        || /abort|network|fetch/i.test(rawMessage);
    const message = isNetworkError
        ? DAILY_LOG_NETWORK_ERROR_MESSAGE
        : action === 'save'
            ? 'Günlük kayıt kaydedilemedi. Lütfen tekrar deneyin.'
            : DAILY_LOG_REQUEST_ERROR_MESSAGE;
    const normalized = new Error(message);
    normalized.code = isNetworkError ? 'DAILY_LOG_NETWORK_ERROR' : 'DAILY_LOG_REQUEST_ERROR';
    return normalized;
};

const getCurrentUserOrThrow = async () => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) throw new Error(SESSION_REQUIRED_MESSAGE);
    return user;
};

export const getDailyLog = async (dateStr) => {
    const user = await getCurrentUserOrThrow();
    let response = null;

    try {
        response = await supabase
            .from('daily_logs')
            .select('*')
            .eq('client_id', user.id)
            .eq('date', dateStr)
            .maybeSingle();
    } catch (error) {
        throw createDailyLogError({ error });
    }

    const { data, error, status } = response;
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw createDailyLogError({ error, status });
    }

    return data || null;
};

export const upsertWaterIntake = async (dateStr, waterAmount) => {
    const normalizedWater = normalizePersistedWaterLiters(waterAmount);
    if (normalizedWater === null || Number.isNaN(normalizedWater)) {
        throw new Error(INVALID_PERSISTED_WATER_MESSAGE);
    }

    const user = await getCurrentUserOrThrow();
    let response = null;

    try {
        response = await supabase
            .from('daily_logs')
            .upsert({
                client_id: user.id,
                date: dateStr,
                water_intake: normalizedWater,
            }, { onConflict: 'client_id,date' })
            .select('client_id,date,water_intake')
            .single();
    } catch (error) {
        if (error?.code?.startsWith('DAILY_LOG_')) throw error;
        throw createDailyLogError({ error, action: 'save' });
    }

    const { data, error, status } = response || {};
    if (error) throw createDailyLogError({ error, status, action: 'save' });

    const persistedWater = normalizePersistedWaterLiters(data?.water_intake);
    if (persistedWater === null || Number.isNaN(persistedWater)) {
        throw new Error(INVALID_PERSISTED_WATER_MESSAGE);
    }

    return persistedWater;
};

export const upsertDailyWeight = async (_dateStr, weight) => {
    await getCurrentUserOrThrow();
    await saveCurrentWeight(weight);
    return true;
};
