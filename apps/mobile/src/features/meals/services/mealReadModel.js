const CANONICAL_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const POSTGRES_TIME_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d)(?::00(?:\.0+)?)?$/;
const CANONICAL_MACRO_KEYS = ['protein', 'carbs', 'fat'];
const CANONICAL_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MACRO_KEY_ALIASES = {
    protein: ['protein', 'protein_g', 'proteinGrams'],
    carbs: ['carbs', 'carbohydrate', 'carbohydrates', 'carbs_g'],
    fat: ['fat', 'fats', 'fat_g'],
};
const { isCanonicalMealCompletionPhotoPath } = require('./mealCompletionPhotoContract.cjs');

export const MealPlanReadErrorCode = {
    AUTHORIZATION: 'authorization',
    FETCH: 'fetch',
    CONTRACT: 'contract',
};

export class MealPlanReadError extends Error {
    constructor(code, message) {
        super(message);
        this.name = 'MealPlanReadError';
        this.code = code;
    }
}

const requireString = (value, fieldName) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, `Plan verisinde geçersiz ${fieldName} alanı bulundu.`);
    }
    return value;
};

const optionalNumber = (value, fieldName) => {
    if (value === null) return null;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, `Plan verisinde geçersiz ${fieldName} alanı bulundu.`);
    }
    return value;
};

const parseMacroPayload = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.macros alanı bulundu.');
        }
        try {
            return JSON.parse(trimmed);
        } catch {
            throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.macros alanı bulundu.');
        }
    }
    return value;
};

const normalizeMacroValue = (value, key) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && !value.trim()) return null;

    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue) || numberValue < 0) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, `Plan verisinde geçersiz meal.macros.${key} alanı bulundu.`);
    }
    return numberValue;
};

const normalizeCanonicalMacros = (value) => {
    const payload = parseMacroPayload(value);
    if (payload === null) return { protein: null, carbs: null, fat: null };
    if (typeof payload !== 'object' || Array.isArray(payload)) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.macros alanı bulundu.');
    }

    const keys = Object.keys(payload);
    if (keys.length === 0) return { protein: null, carbs: null, fat: null };

    const macros = {};
    let recognizedKeyCount = 0;
    CANONICAL_MACRO_KEYS.forEach((key) => {
        const aliases = MACRO_KEY_ALIASES[key];
        const presentAlias = aliases.find((alias) => Object.prototype.hasOwnProperty.call(payload, alias));
        if (!presentAlias) {
            macros[key] = null;
            return;
        }

        recognizedKeyCount += 1;
        macros[key] = normalizeMacroValue(payload[presentAlias], key);
    });

    if (recognizedKeyCount === 0) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.macros anahtarları bulundu.');
    }

    return macros;
};

export const normalizeCanonicalMealTime = (value) => {
    if (typeof value !== 'string') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün saati bulundu.');
    }

    const match = POSTGRES_TIME_PATTERN.exec(value);
    if (!match) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün saati bulundu.');
    }

    return match[1];
};

const requireCanonicalMealTime = (value) => {
    const normalizedTime = normalizeCanonicalMealTime(value);
    if (!CANONICAL_TIME_PATTERN.test(value) || normalizedTime !== value) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün saati bulundu.');
    }
    return normalizedTime;
};

const validateSortOrder = (value) => {
    if (!Number.isInteger(value) || value < 0) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün sırası bulundu.');
    }
    return value;
};

const normalizeMealSource = (source) => {
    if (source === 'manual' || source === 'recipe') return source;
    throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.source alanı bulundu.');
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeRecipeId = (value) => {
    if (value === null || value === undefined) return null;
    const recipeId = requireString(value, 'meal.recipe_id');
    if (!UUID_PATTERN.test(recipeId)) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.recipe_id alanı bulundu.');
    }
    return recipeId;
};

const normalizeDescription = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.description alanı bulundu.');
    }

    const normalized = value.trim();
    return normalized || null;
};

const normalizeCompletionPhotoPath = (value) => {
    if (value === null || value === undefined) return null;
    if (!isCanonicalMealCompletionPhotoPath(value)) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz completion fotoğraf yolu bulundu.');
    }
    return value;
};

export const normalizeCanonicalMeal = (meal, plan) => {
    if (!meal || typeof meal !== 'object') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün bulundu.');
    }

    const id = requireString(meal.id, 'meal.id');
    const planId = requireString(meal.plan_id, 'meal.plan_id');
    if (planId !== plan.id) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Öğün planı beklenen planla eşleşmiyor.');
    }

    if (typeof meal.is_eaten !== 'boolean') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün tamamlanma durumu bulundu.');
    }

    if (meal.photo_url !== null && typeof meal.photo_url !== 'string') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün fotoğraf yolu bulundu.');
    }

    const macros = normalizeCanonicalMacros(meal.macros);
    const source = normalizeMealSource(meal.source);
    const recipeId = normalizeRecipeId(meal.recipe_id);
    const description = normalizeDescription(meal.description);
    const completionPhotoPath = normalizeCompletionPhotoPath(meal.completion_photo_url);

    if (!CANONICAL_MEAL_TYPES.includes(meal.type)) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün türü bulundu.');
    }

    if (source === 'manual' && recipeId !== null) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Manuel öğün recipe_id içeremez.');
    }

    return {
        id,
        planId,
        type: requireString(meal.type, 'meal.type'),
        title: requireString(meal.title, 'meal.title'),
        calories: optionalNumber(meal.calories, 'meal.calories'),
        protein: macros.protein,
        carbohydrate: macros.carbs,
        fat: macros.fat,
        macros,
        time: normalizeCanonicalMealTime(meal.time),
        sortOrder: validateSortOrder(meal.sort_order),
        photoPath: meal.photo_url,
        completionPhotoPath,
        description,
        source,
        recipeId,
        isEaten: meal.is_eaten,
        desc: meal.calories === null ? '' : `${meal.calories} kcal`,
        note: plan.notes || '',
        ingredients: [],
        steps: [],
    };
};

export const sortCanonicalMeals = (meals) => {
    const normalizedMeals = meals.map((meal) => {
        const sortOrder = validateSortOrder(meal.sortOrder);
        requireCanonicalMealTime(meal.time);
        requireString(meal.id, 'meal.id');
        return meal;
    });

    return [...normalizedMeals].sort((left, right) => (
        left.sortOrder - right.sortOrder
        || left.time.localeCompare(right.time)
        || left.id.localeCompare(right.id)
    ));
};

export const getNextIncompleteMeal = (meals, now = new Date()) => {
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const canonicalMeals = meals.map((meal) => ({
        ...meal,
        time: requireCanonicalMealTime(meal.time),
    }));
    const incompleteMeals = canonicalMeals.filter((meal) => !meal.isEaten);
    const upcomingMeals = incompleteMeals.filter((meal) => meal.time >= currentTime);
    const candidates = upcomingMeals.length > 0 ? upcomingMeals : incompleteMeals;

    return [...candidates].sort((left, right) => (
        left.time.localeCompare(right.time)
        || left.sortOrder - right.sortOrder
        || left.id.localeCompare(right.id)
    ))[0] || null;
};
