const getItemText = (item) => {
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item?.name || item?.label || '';
};

export const getUniqueCaseInsensitiveValues = (values = []) => {
    const uniqueValues = [];
    const normalizedValues = new Set();

    values.forEach((value) => {
        const trimmedValue = getItemText(value).trim();
        const normalizedValue = trimmedValue.toLocaleLowerCase('tr-TR');

        if (!trimmedValue || normalizedValues.has(normalizedValue)) return;

        normalizedValues.add(normalizedValue);
        uniqueValues.push(trimmedValue);
    });

    return uniqueValues;
};

export const normalizeMultiValue = (value) => {
    if (value === null || value === undefined || value === '') return [];

    if (Array.isArray(value)) {
        return getUniqueCaseInsensitiveValues(value);
    }

    if (typeof value === 'string') {
        const trimmedValue = value.trim();
        if (!trimmedValue) return [];

        try {
            const parsedValue = JSON.parse(trimmedValue);
            if (Array.isArray(parsedValue)) {
                return getUniqueCaseInsensitiveValues(parsedValue);
            }
        } catch {
            // Eski virgülle ayrılmış kayıt biçimi aşağıda ele alınır.
        }

        return getUniqueCaseInsensitiveValues(trimmedValue.split(/[,;\n]/));
    }

    return [];
};

export const hasProfileValue = (value) => (
    Array.isArray(value)
        ? value.length > 0
        : value !== null
            && value !== undefined
            && String(value).trim() !== ''
);

export const normalizeDecimalInput = (value) => String(value ?? '').trim().replace(',', '.');

export const formatDecimalValue = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return '';
    return String(Number(numericValue.toFixed(2)));
};

export const getAverageSleepHours = (minimum, maximum) => {
    const minValue = Number(minimum);
    const maxValue = Number(maximum);
    const hasMinimum = minimum !== null && minimum !== undefined && minimum !== '' && Number.isFinite(minValue);
    const hasMaximum = maximum !== null && maximum !== undefined && maximum !== '' && Number.isFinite(maxValue);

    if (!hasMinimum && !hasMaximum) return null;
    if (!hasMinimum) return Math.round(maxValue * 2) / 2;
    if (!hasMaximum) return Math.round(minValue * 2) / 2;

    return Math.round(((minValue + maxValue) / 2) * 2) / 2;
};
