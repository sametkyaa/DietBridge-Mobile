import { supabase } from '../../../lib/supabaseClient';
import { saveCurrentWeight } from './clientService';

export const getDailyLog = async (dateStr) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('client_id', user.id)
        .eq('date', dateStr)
        .single();
        
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily log:', error);
        return null; // PGRST116 is No Rows Found, which is fine
    }

    return data;
};

export const upsertWaterIntake = async (dateStr, waterAmount) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");

    const existingLog = await getDailyLog(dateStr);

    if (existingLog) {
        const { error } = await supabase
            .from('daily_logs')
            .update({ water_intake: waterAmount })
            .eq('id', existingLog.id);

        if (error) {
            console.error('Error updating water intake:', error);
            throw error;
        }
    } else {
        const { error } = await supabase
            .from('daily_logs')
            .insert({ 
                client_id: user.id, 
                date: dateStr, 
                water_intake: waterAmount 
            });

        if (error) {
            console.error('Error inserting water intake:', error);
            throw error;
        }
    }

    return true;
};

export const upsertDailyWeight = async (dateStr, weight) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı oturumu bulunamadı.");

    await saveCurrentWeight(weight);
    return true;
};
