'use strict';

const GROCERY_NAME_MIN_LENGTH = 1;
const GROCERY_NAME_MAX_LENGTH = 120;
const GROCERY_NAME_VALIDATION_MESSAGE = 'Ürün adı 1–120 karakter olmalıdır.';
const GROCERY_LOAD_ERROR_MESSAGE = 'Alışveriş listesi yüklenemedi. Lütfen tekrar deneyin.';
const GROCERY_MUTATION_ERROR_MESSAGE = 'Alışveriş listesi güncellenemedi. Lütfen tekrar deneyin.';

const normalizeSessionUserId = (userId) => (
    typeof userId === 'string' && userId.trim() ? userId : null
);

const normalizeGroceryName = (value) => {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length >= GROCERY_NAME_MIN_LENGTH
        && normalized.length <= GROCERY_NAME_MAX_LENGTH
        ? normalized
        : null;
};

const normalizeGroceryItem = (row, expectedClientId = null) => {
    const clientId = normalizeSessionUserId(row?.client_id);
    const name = normalizeGroceryName(row?.name);
    const id = typeof row?.id === 'string' && row.id.trim() ? row.id : null;
    const createdAt = typeof row?.created_at === 'string' && row.created_at.trim()
        ? row.created_at
        : null;

    if (!id || !clientId || (expectedClientId && clientId !== expectedClientId)
        || !name || typeof row?.is_completed !== 'boolean' || !createdAt) {
        throw new Error('Alışveriş listesi veri sözleşmesi doğrulanamadı.');
    }

    return {
        id,
        clientId,
        name,
        isCompleted: row.is_completed,
        createdAt,
    };
};

const compareText = (left, right) => {
    const leftText = String(left || '');
    const rightText = String(right || '');
    if (leftText < rightText) return -1;
    if (leftText > rightText) return 1;
    return 0;
};

const sortGroceryItems = (items = []) => [...items].sort((left, right) => (
    Number(Boolean(left.isCompleted)) - Number(Boolean(right.isCompleted))
        || compareText(left.createdAt, right.createdAt)
        || compareText(left.id, right.id)
));

const replaceGroceryItem = (items, nextItem) => {
    let replaced = false;
    const next = items.map((item) => {
        if (item.id !== nextItem.id) return item;
        replaced = true;
        return nextItem;
    });
    return replaced ? sortGroceryItems(next) : sortGroceryItems([...next, nextItem]);
};

const removeGroceryItem = (items, itemId) => items.filter((item) => item.id !== itemId);

const restoreGroceryItem = (items, previousItem, previousIndex = items.length) => {
    const withoutCurrent = items.filter((item) => item.id !== previousItem.id);
    const boundedIndex = Math.max(0, Math.min(previousIndex, withoutCurrent.length));
    const restored = [...withoutCurrent];
    restored.splice(boundedIndex, 0, previousItem);
    return sortGroceryItems(restored);
};

const isGroceryLoadCurrent = ({
    requestGeneration,
    currentGeneration,
    requestSequence,
    currentSequence,
    requestUserId,
    activeUserId,
}) => {
    const requestUser = normalizeSessionUserId(requestUserId);
    const activeUser = normalizeSessionUserId(activeUserId);
    return Boolean(requestUser)
        && requestGeneration === currentGeneration
        && requestSequence === currentSequence
        && requestUser === activeUser;
};

const isGroceryMutationCurrent = ({
    mutationGeneration,
    currentGeneration,
    mutationId,
    activeMutationId,
    mutationUserId,
    activeUserId,
}) => {
    const mutationUser = normalizeSessionUserId(mutationUserId);
    const activeUser = normalizeSessionUserId(activeUserId);
    return Boolean(mutationUser)
        && mutationGeneration === currentGeneration
        && mutationId === activeMutationId
        && mutationUser === activeUser;
};

module.exports = {
    GROCERY_LOAD_ERROR_MESSAGE,
    GROCERY_MUTATION_ERROR_MESSAGE,
    GROCERY_NAME_MAX_LENGTH,
    GROCERY_NAME_MIN_LENGTH,
    GROCERY_NAME_VALIDATION_MESSAGE,
    isGroceryLoadCurrent,
    isGroceryMutationCurrent,
    normalizeGroceryItem,
    normalizeGroceryName,
    removeGroceryItem,
    replaceGroceryItem,
    restoreGroceryItem,
    sortGroceryItems,
};
