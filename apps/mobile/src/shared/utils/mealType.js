const MEAL_TYPE_LABELS = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    snack: 'Ara Öğün',
    morning_snack: 'Kuşluk',
    afternoon_snack: 'İkindi Ara Öğünü',
    evening_snack: 'Gece Ara Öğünü',
};

export const formatMealType = (value) => {
    const key = String(value || '').trim().toLowerCase();
    return MEAL_TYPE_LABELS[key] || String(value || '').trim() || 'Öğün';
};
