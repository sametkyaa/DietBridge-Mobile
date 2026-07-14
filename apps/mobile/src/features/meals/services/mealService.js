import { supabase } from '../../../lib/supabaseClient';
import { getActiveDietitianConnection } from '../../dietitianConnection/services/dietitianConnectionService';

const INVALID_MEAL_ID_MESSAGE = 'Geçerli öğün ID bulunamadı.';
const MEAL_COMPLETION_UPDATE_ERROR_MESSAGE = 'Öğün durumu güncellenemedi.';
const MEAL_SELECT_COLUMNS = 'id, plan_id, type, title, calories, macros, photo_url, is_eaten';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getDailyMeals = async (planDate) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const activeConnection = await getActiveDietitianConnection(user.id);
    if (!activeConnection) return [];

    const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .select(`
            id,
            plan_date,
            notes,
            meals (${MEAL_SELECT_COLUMNS})
        `)
        .eq('client_id', user.id)
        .eq('dietitian_id', activeConnection.dietitian_id)
        .eq('plan_date', planDate)
        .maybeSingle();

    if (planError) {
        console.error('Error fetching meal plan:', {
            userId: user.id,
            planDate,
            dietitianId: activeConnection.dietitian_id,
            supabaseError: planError,
        });
        return [];
    }

    if (!plan || !plan.meals) return [];

    return plan.meals.map((meal) => {
        const titles = {
            breakfast: 'Kahvaltı',
            lunch: 'Öğle Yemeği',
            dinner: 'Akşam Yemeği',
            snack: 'Ara Öğün',
        };

        const times = {
            breakfast: '08:00',
            lunch: '13:00',
            dinner: '19:00',
            snack: '15:30',
        };

        return {
            id: meal.id,
            plan_id: meal.plan_id,
            type: meal.type,
            title: meal.title || titles[meal.type] || 'Öğün',
            time: times[meal.type] || '',
            desc: meal.calories ? `${meal.calories} kcal` : '',
            calories: meal.calories,
            macros: meal.macros,
            is_eaten: !!meal.is_eaten,
            photo_url: meal.photo_url || null,
            ingredients: [],
            steps: [],
            note: plan.notes || '',
        };
    });
};

export const updateMealCompletion = async (mealId, isEaten) => {
    if (typeof mealId !== 'string' || !UUID_PATTERN.test(mealId)) {
        throw new Error(INVALID_MEAL_ID_MESSAGE);
    }

    if (typeof isEaten !== 'boolean') {
        throw new Error(MEAL_COMPLETION_UPDATE_ERROR_MESSAGE);
    }

    const { data, error } = await supabase.rpc('set_my_meal_completion', {
        p_meal_id: mealId,
        p_is_eaten: isEaten,
    });

    if (error || data !== true) {
        throw new Error(MEAL_COMPLETION_UPDATE_ERROR_MESSAGE);
    }

    // The RPC returns a boolean rather than a meal row; preserve callers' meal state by merging this minimal result.
    return { id: mealId, is_eaten: isEaten };
};
