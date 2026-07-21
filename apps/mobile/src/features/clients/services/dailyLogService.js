import { supabase } from '../../../lib/supabaseClient';
import { saveCurrentWeight } from './clientService';

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
    const user = await getCurrentUserOrThrow();
    const existingLog = await getDailyLog(dateStr);

    try {
        if (existingLog) {
            const { error, status } = await supabase
                .from('daily_logs')
                .update({ water_intake: waterAmount })
                .eq('id', existingLog.id);
            if (error) throw createDailyLogError({ error, status, action: 'save' });
        } else {
            const { error, status } = await supabase
                .from('daily_logs')
                .insert({
                    client_id: user.id,
                    date: dateStr,
                    water_intake: waterAmount,
                });
            if (error) throw createDailyLogError({ error, status, action: 'save' });
        }
    } catch (error) {
        if (error?.code?.startsWith('DAILY_LOG_')) throw error;
        throw createDailyLogError({ error, action: 'save' });
    }

    return true;
};

export const upsertDailyWeight = async (_dateStr, weight) => {
    await getCurrentUserOrThrow();
    await saveCurrentWeight(weight);
    return true;
};
