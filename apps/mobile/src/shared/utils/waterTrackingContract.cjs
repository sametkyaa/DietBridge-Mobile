'use strict';

const WATER_TARGET_LITERS = 3;
const WATER_INPUT_VALIDATION_MESSAGE = '1–9999 ml arasında geçerli bir miktar girin.';
const INVALID_PERSISTED_WATER_MESSAGE = 'Günlük su kaydı geçersiz.';

const normalizePersistedWaterLiters = (value) => {
    if (value === null || value === undefined) return null;

    if (typeof value === 'string' && !/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(value.trim())) {
        return Number.NaN;
    }
    if (typeof value !== 'number' && typeof value !== 'string') return Number.NaN;

    const number = typeof value === 'string' ? Number(value.trim()) : value;
    return Number.isFinite(number) && number >= 0 ? number : Number.NaN;
};

const parseWaterInputMl = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return null;

    const normalized = String(value).trim();
    if (!/^\d+$/.test(normalized)) return null;

    const amountMl = Number(normalized);
    return Number.isSafeInteger(amountMl) && amountMl >= 1 && amountMl <= 9999
        ? amountMl
        : null;
};

const waterMlToLiters = (amountMl) => amountMl / 1000;

const applyWaterDelta = (currentLiters, amountMl, direction) => {
    const normalized = normalizePersistedWaterLiters(currentLiters);
    if (Number.isNaN(normalized)) return Number.NaN;

    const base = normalized ?? 0;
    const delta = waterMlToLiters(amountMl);
    return direction === 'remove'
        ? Math.max(base - delta, 0)
        : base + delta;
};

const addWaterLiters = (currentLiters, amountMl) => (
    applyWaterDelta(currentLiters, amountMl, 'add')
);

const removeWaterLiters = (currentLiters, amountMl) => (
    applyWaterDelta(currentLiters, amountMl, 'remove')
);

const getWaterProgress = (value, targetLiters = WATER_TARGET_LITERS) => {
    const normalized = normalizePersistedWaterLiters(value);
    if (normalized === null || Number.isNaN(normalized) || !Number.isFinite(targetLiters) || targetLiters <= 0) {
        return 0;
    }
    return Math.min(Math.max(normalized / targetLiters, 0), 1);
};

const isWaterLoadCurrent = ({
    requestGeneration,
    currentGeneration,
    requestSequence,
    currentSequence,
    requestDateKey,
    activeDateKey,
}) => (
    requestGeneration === currentGeneration
    && requestSequence === currentSequence
    && requestDateKey === activeDateKey
);

const isWaterMutationCurrent = ({
    mutationGeneration,
    currentGeneration,
    mutationId,
    activeMutationId,
    mutationDateKey,
    activeDateKey,
}) => (
    mutationGeneration === currentGeneration
    && mutationId === activeMutationId
    && mutationDateKey === activeDateKey
);

module.exports = {
    INVALID_PERSISTED_WATER_MESSAGE,
    WATER_INPUT_VALIDATION_MESSAGE,
    WATER_TARGET_LITERS,
    addWaterLiters,
    getWaterProgress,
    isWaterLoadCurrent,
    isWaterMutationCurrent,
    normalizePersistedWaterLiters,
    parseWaterInputMl,
    removeWaterLiters,
    waterMlToLiters,
};
