import { supabase } from '../../../lib/supabaseClient';
import { ChatServiceError, CHAT_ERROR_CODES } from './chatService';
import { isValidUuid, normalizeIsoTimestamp } from '../utils/chatMessageUtils';
import {
    MEAL_ACTIVITY_KIND,
    createMealActivityId,
    mergeMealActivities,
} from '../utils/mealActivityUtils';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d(?:\.\d+)?)?$/;
const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack']);
const MEAL_ACTIVITY_SELECT = `id, client_id, dietitian_id, plan_date, meals (id, plan_id, type, title, time, sort_order, is_eaten, completed_at, photo_url)`;

const invalidPayload = (field) => new ChatServiceError(
    CHAT_ERROR_CODES.UNKNOWN,
    'Öğün aktivitesi yanıtı beklenen biçimde değil.',
    new Error(`Invalid meal activity field: ${field}`),
);

const normalizeMealTime = (value) => {
    if (typeof value !== 'string') throw invalidPayload('meal.time');
    const match = TIME_PATTERN.exec(value);
    if (!match) throw invalidPayload('meal.time');
    return `${match[1]}:${match[2]}`;
};

const normalizePhotoPath = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string' || !value.trim()) throw invalidPayload('meal.photo_url');
    if (!value.startsWith('meal-plans/') && !value.startsWith('recipes/') && !/^https:\/\/images\.unsplash\.com\//.test(value)) {
        throw invalidPayload('meal.photo_url');
    }
    return value;
};

const normalizeActivities = ({ data, relationId, conversationId, clientId, dietitianId }) => {
    if (!Array.isArray(data)) throw invalidPayload('meal_plans');
    const activities = [];

    data.forEach((plan) => {
        if (!plan || typeof plan !== 'object' || Array.isArray(plan)
            || !isValidUuid(plan.id)
            || plan.client_id !== clientId
            || plan.dietitian_id !== dietitianId
            || typeof plan.plan_date !== 'string'
            || !ISO_DATE_PATTERN.test(plan.plan_date)
            || !Array.isArray(plan.meals)) {
            throw invalidPayload('meal_plan');
        }

        plan.meals.forEach((meal) => {
            if (!meal?.is_eaten) return;
            if (!isValidUuid(meal.id)
                || !isValidUuid(meal.plan_id)
                || meal.plan_id !== plan.id
                || !MEAL_TYPES.has(meal.type)
                || typeof meal.title !== 'string'
                || !meal.title.trim()
                || !Number.isInteger(meal.sort_order)
                || meal.sort_order < 0) {
                throw invalidPayload('meal');
            }

            const completedAt = normalizeIsoTimestamp(meal.completed_at);
            if (!completedAt) return;

            activities.push({
                id: createMealActivityId(meal.id),
                kind: MEAL_ACTIVITY_KIND,
                relationId,
                conversationId,
                clientId,
                dietitianId,
                mealId: meal.id,
                planId: plan.id,
                mealDate: plan.plan_date,
                mealType: meal.type,
                mealTitle: meal.title.trim(),
                mealTime: normalizeMealTime(meal.time),
                completedAt,
                createdAt: completedAt,
                photoPath: normalizePhotoPath(meal.photo_url),
                isHumanMessage: false,
                requiresRead: false,
            });
        });
    });

    return mergeMealActivities([], activities);
};

export const fetchMealActivities = async ({ conversation, currentUserId } = {}) => {
    const relationId = conversation?.relationId;
    const conversationId = conversation?.id;
    const clientId = conversation?.clientId;
    const dietitianId = conversation?.dietitianId;
    if (![relationId, conversationId, clientId, dietitianId, currentUserId].every(isValidUuid)) {
        throw new ChatServiceError(CHAT_ERROR_CODES.INVALID_INPUT, 'Öğün aktivitesi kimliği geçersiz.');
    }
    if (currentUserId !== clientId) {
        throw new ChatServiceError(CHAT_ERROR_CODES.FORBIDDEN, 'Bu öğün aktivitelerine erişim izniniz yok.');
    }

    try {
        const { data: relationship, error: relationshipError } = await supabase
            .from('dietitian_clients')
            .select('id, client_id, dietitian_id, status')
            .eq('id', relationId)
            .eq('client_id', clientId)
            .eq('dietitian_id', dietitianId)
            .eq('status', 'active')
            .maybeSingle();
        if (relationshipError) throw relationshipError;
        if (!relationship
            || relationship.id !== relationId
            || relationship.client_id !== clientId
            || relationship.dietitian_id !== dietitianId
            || relationship.status !== 'active') {
            throw new ChatServiceError(CHAT_ERROR_CODES.FORBIDDEN, 'Bu öğün aktivitelerine erişim izniniz yok.');
        }

        const { data, error } = await supabase
            .from('meal_plans')
            .select(MEAL_ACTIVITY_SELECT)
            .eq('client_id', clientId)
            .eq('dietitian_id', dietitianId)
            .order('plan_date', { ascending: true })
            .order('id', { ascending: true });
        if (error) throw error;
        return normalizeActivities({ data, relationId, conversationId, clientId, dietitianId });
    } catch (error) {
        if (error instanceof ChatServiceError) throw error;
        throw new ChatServiceError(
            CHAT_ERROR_CODES.DATABASE,
            'Öğün aktiviteleri şu anda yüklenemiyor.',
            error,
        );
    }
};
