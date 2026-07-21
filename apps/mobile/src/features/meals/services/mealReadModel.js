const CANONICAL_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const POSTGRES_TIME_PATTERN = /^(([01]\d|2[0-3]):[0-5]\d)(?::00(?:\.0+)?)?$/;
const CANONICAL_MACRO_KEYS = ['protein', 'carbs', 'fat'];

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

const normalizeCanonicalMacros = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.macros alanı bulundu.');
    }

    const keys = Object.keys(value);
    if (keys.length !== CANONICAL_MACRO_KEYS.length
        || keys.some((key) => !CANONICAL_MACRO_KEYS.includes(key))) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz meal.macros anahtarları bulundu.');
    }

    const macros = {};
    CANONICAL_MACRO_KEYS.forEach((key) => {
        const macroValue = value[key];
        if (typeof macroValue !== 'number' || !Number.isFinite(macroValue) || macroValue < 0) {
            throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, `Plan verisinde geçersiz meal.macros.${key} alanı bulundu.`);
        }
        macros[key] = macroValue;
    });

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

export const normalizeCanonicalMeal = (meal, plan) => {
    if (!meal || typeof meal !== 'object') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün bulundu.');
    }

    const id = requireString(meal.id, 'meal.id');
    const planId = requireString(meal.plan_id, 'meal.plan_id');
    if (planId !== plan.id) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Öğün planı beklenen planla eşleşmiyor.');
    }

    if (meal.source !== 'manual' || meal.recipe_id !== null) {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisi desteklenmeyen öğün kaynağı içeriyor.');
    }

    if (typeof meal.is_eaten !== 'boolean') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün tamamlanma durumu bulundu.');
    }

    if (meal.photo_url !== null && typeof meal.photo_url !== 'string') {
        throw new MealPlanReadError(MealPlanReadErrorCode.CONTRACT, 'Plan verisinde geçersiz öğün fotoğraf yolu bulundu.');
    }

    const macros = normalizeCanonicalMacros(meal.macros);

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
        source: meal.source,
        recipeId: meal.recipe_id,
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
