import { supabase } from '../../../lib/supabaseClient';
import {
    CONNECTION_GENERIC_ERROR_MESSAGE,
    CONNECTION_REQUIRED_MESSAGE,
    getActiveDietitianConnection,
} from '../../dietitianConnection/services/dietitianConnectionService';

const INVALID_MEAL_ID_MESSAGE = 'Geçerli öğün ID bulunamadı.';
const MEAL_NOT_FOUND_OR_FORBIDDEN_MESSAGE = 'Öğün bulunamadı veya bu öğünü güncelleme yetkiniz yok.';
const MEAL_SELECT_COLUMNS = 'id, plan_id, type, title, calories, macros, photo_url, is_eaten';

const attachMealDebugContext = (error, context = {}) => {
    if (error && typeof error === 'object') {
        error.debugContext = {
            ...(error.debugContext || {}),
            ...context,
        };
    }

    return error;
};

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
    if (!mealId) {
        throw new Error(INVALID_MEAL_ID_MESSAGE);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Kullanıcı oturumu bulunamadı.');

    const debugContext = {
        mealId,
        userId: user.id,
        nextIsEaten: Boolean(isEaten),
    };

    console.log('Updating meal completion:', debugContext);

    const activeConnection = await getActiveDietitianConnection(user.id);
    if (!activeConnection) {
        throw attachMealDebugContext(new Error(CONNECTION_REQUIRED_MESSAGE), debugContext);
    }

    const { data: meal, error: mealLookupError } = await supabase
        .from('meals')
        .select('id, plan_id')
        .eq('id', mealId)
        .maybeSingle();

    if (mealLookupError || !meal?.plan_id) {
        console.error('Error looking up meal before completion update:', {
            ...debugContext,
            supabaseError: mealLookupError,
            meal,
        });
        throw attachMealDebugContext(
            new Error(MEAL_NOT_FOUND_OR_FORBIDDEN_MESSAGE),
            { ...debugContext, supabaseError: mealLookupError, meal },
        );
    }

    const { data: plan, error: planLookupError } = await supabase
        .from('meal_plans')
        .select('id')
        .eq('id', meal.plan_id)
        .eq('client_id', user.id)
        .eq('dietitian_id', activeConnection.dietitian_id)
        .maybeSingle();

    if (planLookupError) {
        console.error('Error checking active meal plan relation:', {
            ...debugContext,
            planId: meal.plan_id,
            dietitianId: activeConnection.dietitian_id,
            supabaseError: planLookupError,
        });
        throw attachMealDebugContext(
            new Error(CONNECTION_GENERIC_ERROR_MESSAGE),
            {
                ...debugContext,
                planId: meal.plan_id,
                dietitianId: activeConnection.dietitian_id,
                supabaseError: planLookupError,
            },
        );
    }

    if (!plan) {
        console.error('Meal plan relation not found for meal completion update:', {
            ...debugContext,
            planId: meal.plan_id,
            dietitianId: activeConnection.dietitian_id,
        });
        throw attachMealDebugContext(
            new Error(MEAL_NOT_FOUND_OR_FORBIDDEN_MESSAGE),
            {
                ...debugContext,
                planId: meal.plan_id,
                dietitianId: activeConnection.dietitian_id,
            },
        );
    }

    const { data, error } = await supabase
        .from('meals')
        .update({ is_eaten: Boolean(isEaten) })
        .eq('id', mealId)
        .select(MEAL_SELECT_COLUMNS)
        .maybeSingle();

    if (error) {
        console.error('Error updating meal completion:', {
            ...debugContext,
            planId: meal.plan_id,
            dietitianId: activeConnection.dietitian_id,
            supabaseError: error,
        });
        throw attachMealDebugContext(
            new Error(CONNECTION_GENERIC_ERROR_MESSAGE),
            {
                ...debugContext,
                planId: meal.plan_id,
                dietitianId: activeConnection.dietitian_id,
                supabaseError: error,
            },
        );
    }

    if (!data) {
        console.error('Meal completion update returned no rows:', {
            ...debugContext,
            planId: meal.plan_id,
            dietitianId: activeConnection.dietitian_id,
        });
        throw attachMealDebugContext(
            new Error(MEAL_NOT_FOUND_OR_FORBIDDEN_MESSAGE),
            {
                ...debugContext,
                planId: meal.plan_id,
                dietitianId: activeConnection.dietitian_id,
            },
        );
    }

    return data;
};
