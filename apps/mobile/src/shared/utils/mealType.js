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

export const MEAL_SLOT_LABEL_MAX_LENGTH = 40;

// Optional dietitian-defined slot name (meals.slot_label). Falls back to the
// canonical meal type label when the plan carries no custom name.
export const formatMealSlotName = (meal) => {
    const label = typeof meal?.slotLabel === 'string' ? meal.slotLabel.trim() : '';
    if (label && label.length <= MEAL_SLOT_LABEL_MAX_LENGTH) return label;
    return formatMealType(meal?.type);
};
