import { supabase } from '../../../lib/supabaseClient';
import {
    MealPlanReadError,
    MealPlanReadErrorCode,
    normalizeCanonicalMeal,
    sortCanonicalMeals,
} from './mealReadModel';

const INVALID_MEAL_ID_MESSAGE = 'Geçerli öğün ID bulunamadı.';
const MEAL_COMPLETION_UPDATE_ERROR_MESSAGE = 'Öğün durumu güncellenemedi.';
const ACTIVE_CONNECTION_SELECT_COLUMNS = 'id, client_id, dietitian_id, status';
const MEAL_SELECT_COLUMNS = 'id, plan_id, type, title, description, calories, macros, time, sort_order, photo_url, source, recipe_id, is_eaten';
const PLAN_SELECT_COLUMNS = `id, client_id, dietitian_id, plan_date, notes, meals (${MEAL_SELECT_COLUMNS})`;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createReadError = (code, message) => new MealPlanReadError(code, message);

const validatePlanDate = (planDate) => {
    if (typeof planDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(planDate)) {
        throw createReadError(MealPlanReadErrorCode.CONTRACT, 'Geçerli bir plan tarihi bulunamadı.');
    }
};

const getAuthenticatedClient = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user?.id) {
        throw createReadError(MealPlanReadErrorCode.AUTHORIZATION, 'Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın.');
    }
    return data.user;
};

const getSingleActiveConnection = async (clientId) => {
    const { data, error } = await supabase
        .from('dietitian_clients')
        .select(ACTIVE_CONNECTION_SELECT_COLUMNS)
        .eq('client_id', clientId)
        .eq('status', 'active');

    if (error) {
        throw createReadError(MealPlanReadErrorCode.FETCH, 'Diyetisyen bağlantısı alınamadı. Lütfen tekrar deneyin.');
    }

    if (!Array.isArray(data)) {
        throw createReadError(MealPlanReadErrorCode.CONTRACT, 'Diyetisyen bağlantısı için geçersiz bir yanıt alındı.');
    }

    if (data.length === 0) return null;
    if (data.length !== 1 || !data[0]?.dietitian_id) {
        throw createReadError(MealPlanReadErrorCode.CONTRACT, 'Birden fazla veya geçersiz aktif diyetisyen bağlantısı bulundu.');
    }

    return data[0];
};

const getSingleDailyPlan = async ({ clientId, dietitianId, planDate }) => {
    const { data, error } = await supabase
        .from('meal_plans')
        .select(PLAN_SELECT_COLUMNS)
        .eq('client_id', clientId)
        .eq('dietitian_id', dietitianId)
        .eq('plan_date', planDate);

    if (error) {
        throw createReadError(MealPlanReadErrorCode.FETCH, 'Beslenme planı alınamadı. Lütfen tekrar deneyin.');
    }

    if (!Array.isArray(data)) {
        throw createReadError(MealPlanReadErrorCode.CONTRACT, 'Beslenme planı için geçersiz bir yanıt alındı.');
    }

    if (data.length === 0) return null;
    if (data.length !== 1) {
        throw createReadError(MealPlanReadErrorCode.CONTRACT, 'Aynı gün için birden fazla beslenme planı bulundu.');
    }

    return data[0];
};

const normalizePlan = (plan, { clientId, dietitianId, planDate }) => {
    if (!plan || plan.id === undefined || plan.client_id !== clientId
        || plan.dietitian_id !== dietitianId || plan.plan_date !== planDate
        || !Array.isArray(plan.meals)) {
        throw createReadError(MealPlanReadErrorCode.CONTRACT, 'Beslenme planı sözleşmesi doğrulanamadı.');
    }

    const normalizedPlan = {
        id: String(plan.id),
        clientId: clientId,
        dietitianId: dietitianId,
        planDate: planDate,
        notes: plan.notes || '',
    };
    const meals = sortCanonicalMeals(plan.meals.map((meal) => normalizeCanonicalMeal(meal, normalizedPlan)));

    return { plan: normalizedPlan, meals };
};

// This is the canonical mobile read contract. It distinguishes empty and unlinked
// states from fetch, authorization, and data-contract failures.
export const getDailyMealPlan = async (planDate) => {
    validatePlanDate(planDate);
    const user = await getAuthenticatedClient();
    const activeConnection = await getSingleActiveConnection(user.id);

    if (!activeConnection) {
        return { status: 'unlinked', plan: null, meals: [] };
    }

    const plan = await getSingleDailyPlan({
        clientId: user.id,
        dietitianId: activeConnection.dietitian_id,
        planDate,
    });

    if (!plan) {
        return { status: 'empty', plan: null, meals: [] };
    }

    const normalized = normalizePlan(plan, {
        clientId: user.id,
        dietitianId: activeConnection.dietitian_id,
        planDate,
    });

    return {
        status: normalized.meals.length === 0 ? 'empty' : 'success',
        ...normalized,
    };
};

export const updateMealCompletion = async (mealId, isEaten) => {
    if (typeof mealId !== 'string' || !UUID_PATTERN.test(mealId)) {
        throw new Error(INVALID_MEAL_ID_MESSAGE);
    }

    if (typeof isEaten !== 'boolean') {
        throw new Error(MEAL_COMPLETION_UPDATE_ERROR_MESSAGE);
    }

    try {
        const { data, error } = await supabase.rpc('set_my_meal_completion', {
            p_meal_id: mealId,
            p_is_eaten: isEaten,
        });

        if (error || data !== true) {
            throw new Error(MEAL_COMPLETION_UPDATE_ERROR_MESSAGE);
        }

        return { id: mealId, isEaten };
    } catch (error) {
        if (__DEV__) {
            console.warn('Meal completion RPC failed.', { mealId });
        }

        throw new Error(MEAL_COMPLETION_UPDATE_ERROR_MESSAGE);
    }
};
