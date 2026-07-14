import { supabase } from '../../../lib/supabaseClient';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
    getActiveDietitianConnection,
} from '../../dietitianConnection/services/dietitianConnectionService';

export const submitMealChangeRequest = async ({ plan_date, meal_slot, requested_meals, notes }) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) throw new Error('Aksiyon için oturum açmalısınız.');

    const relation = await getActiveDietitianConnection(user.id);
    if (!relation) throw new Error(CONNECTION_REQUIRED_MESSAGE);

    const { data, error } = await supabase
        .from('meal_change_requests')
        .insert({
            client_id: user.id,
            dietitian_id: relation.dietitian_id,
            plan_date,
            meal_slot,
            requested_meals,
            notes,
            status: 'pending',
        })
        .select()
        .single();

    if (error) {
        console.error('Meal change request error:', error);
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }

    return data;
};
