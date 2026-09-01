import { supabase } from '../../../lib/supabaseClient';
const {
    GROCERY_LOAD_ERROR_MESSAGE,
    GROCERY_MUTATION_ERROR_MESSAGE,
    GROCERY_NAME_VALIDATION_MESSAGE,
    normalizeGroceryItem,
    normalizeGroceryName,
    sortGroceryItems,
} = require('../utils/groceryContract.cjs');

const GROCERY_SELECT = 'id,client_id,name,is_completed,created_at';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION_REQUIRED_MESSAGE = 'Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın.';

export class GroceryServiceError extends Error {
    constructor(message, cause = null) {
        super(message);
        this.name = 'GroceryServiceError';
        this.cause = cause;
    }
}

const getCurrentUserOrThrow = async () => {
    let response;
    try {
        response = await supabase.auth.getUser();
    } catch (error) {
        throw new GroceryServiceError(SESSION_REQUIRED_MESSAGE, error);
    }

    const user = response?.data?.user;
    if (response?.error || !user?.id) {
        throw new GroceryServiceError(SESSION_REQUIRED_MESSAGE, response?.error || null);
    }
    return user;
};

const normalizeRows = (rows, clientId) => {
    try {
        return sortGroceryItems((rows || []).map((row) => normalizeGroceryItem(row, clientId)));
    } catch (error) {
        throw new GroceryServiceError(GROCERY_LOAD_ERROR_MESSAGE, error);
    }
};

const normalizeMutationRow = (row, clientId) => {
    try {
        return normalizeGroceryItem(row, clientId);
    } catch (error) {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, error);
    }
};

export const fetchGroceryItems = async () => {
    const user = await getCurrentUserOrThrow();
    let response;

    try {
        response = await supabase
            .from('grocery_items')
            .select(GROCERY_SELECT)
            .eq('client_id', user.id)
            .order('is_completed', { ascending: true })
            .order('created_at', { ascending: true })
            .order('id', { ascending: true });
    } catch (error) {
        throw new GroceryServiceError(GROCERY_LOAD_ERROR_MESSAGE, error);
    }

    if (response?.error) throw new GroceryServiceError(GROCERY_LOAD_ERROR_MESSAGE, response.error);
    return normalizeRows(response?.data, user.id);
};

export const createGroceryItem = async (name) => {
    const normalizedName = normalizeGroceryName(name);
    if (!normalizedName) throw new GroceryServiceError(GROCERY_NAME_VALIDATION_MESSAGE);

    const user = await getCurrentUserOrThrow();
    let response;
    try {
        response = await supabase
            .from('grocery_items')
            .insert({ client_id: user.id, name: normalizedName, is_completed: false })
            .select(GROCERY_SELECT)
            .single();
    } catch (error) {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, error);
    }

    if (response?.error) throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, response.error);
    return normalizeMutationRow(response?.data, user.id);
};

const validateItemId = (itemId) => {
    if (typeof itemId !== 'string' || !UUID_PATTERN.test(itemId)) {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, new Error('Invalid grocery item id'));
    }
};

export const updateGroceryItemCompletion = async (itemId, isCompleted) => {
    validateItemId(itemId);
    if (typeof isCompleted !== 'boolean') {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, new Error('Invalid completion state'));
    }

    const user = await getCurrentUserOrThrow();
    let response;
    try {
        response = await supabase
            .from('grocery_items')
            .update({ is_completed: isCompleted })
            .eq('id', itemId)
            .eq('client_id', user.id)
            .select(GROCERY_SELECT)
            .single();
    } catch (error) {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, error);
    }

    if (response?.error) throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, response.error);
    return normalizeMutationRow(response?.data, user.id);
};

export const deleteGroceryItem = async (itemId) => {
    validateItemId(itemId);
    const user = await getCurrentUserOrThrow();
    let response;
    try {
        response = await supabase
            .from('grocery_items')
            .delete()
            .eq('id', itemId)
            .eq('client_id', user.id)
            .select('id,client_id')
            .maybeSingle();
    } catch (error) {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, error);
    }

    if (response?.error || response?.data?.id !== itemId || response?.data?.client_id !== user.id) {
        throw new GroceryServiceError(GROCERY_MUTATION_ERROR_MESSAGE, response?.error || null);
    }
    return response.data.id;
};
