import { formatMealType } from '../../../shared/utils/mealType';

const toFiniteNumber = (value) => {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

export const mapDashboardMeal = (meal, completion = null) => {
    const hasCompletionState = completion && typeof completion === 'object';
    const isEaten = hasCompletionState && typeof completion.completed === 'boolean'
        ? completion.completed
        : !!meal.isEaten;

    return {
        id: meal.id,
        title: meal.title || formatMealType(meal.type),
        type: meal.type,
        time: meal.time,
        status: isEaten ? 'completed' : 'upcoming',
        badgeLabel: isEaten ? 'Tamamlandı' : 'Planlandı',
        isEaten,
        photoPath: meal.photoPath || null,
        completionPhotoPath: isEaten
            ? completion?.completionPhotoPath || meal.completionPhotoPath || null
            : null,
        localCompletionPhotoUri: isEaten ? completion?.localCompletionPhotoUri || null : null,
        calories: meal.calories,
        carbohydrate: toFiniteNumber(meal.carbohydrate),
        protein: toFiniteNumber(meal.protein),
        fat: toFiniteNumber(meal.fat),
        description: meal.description || null,
        source: meal.source,
        recipeId: meal.recipeId,
        note: meal.note || '',
        ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
        steps: Array.isArray(meal.steps) ? meal.steps : [],
    };
};

export const buildDashboardNutrition = (meals = []) => {
    const completedMeals = meals.filter((meal) => meal.isEaten);
    const totals = completedMeals.reduce((result, meal) => ({
        calories: result.calories + toFiniteNumber(meal.calories),
        carbohydrate: result.carbohydrate + toFiniteNumber(meal.carbohydrate),
        protein: result.protein + toFiniteNumber(meal.protein),
        fat: result.fat + toFiniteNumber(meal.fat),
    }), { calories: 0, carbohydrate: 0, protein: 0, fat: 0 });

    return {
        completedCount: completedMeals.length,
        rows: [
            { key: 'calories', label: 'Kalori', icon: 'meal', value: `${Math.round(totals.calories)} kcal` },
            { key: 'protein', label: 'Protein', icon: 'drumstick', value: `${Math.round(totals.protein)} g` },
            { key: 'carbohydrate', label: 'Karbonhidrat', icon: 'wheat', value: `${Math.round(totals.carbohydrate)} g` },
            { key: 'fat', label: 'Yağ', icon: 'leaf', value: `${Math.round(totals.fat)} g` },
        ],
    };
};
