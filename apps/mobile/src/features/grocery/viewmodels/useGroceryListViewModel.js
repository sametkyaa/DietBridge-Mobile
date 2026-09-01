import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    createGroceryItem,
    deleteGroceryItem,
    fetchGroceryItems,
    updateGroceryItemCompletion,
} from '../services/groceryService';
const {
    GROCERY_LOAD_ERROR_MESSAGE,
    GROCERY_MUTATION_ERROR_MESSAGE,
    GROCERY_NAME_VALIDATION_MESSAGE,
    isGroceryLoadCurrent,
    isGroceryMutationCurrent,
    normalizeGroceryName,
    removeGroceryItem,
    replaceGroceryItem,
    restoreGroceryItem,
    sortGroceryItems,
} = require('../utils/groceryContract.cjs');
const { hasSessionChanged, normalizeSessionUserId } = require('../../clients/viewmodels/sessionDataIsolation.cjs');

export const useGroceryListViewModel = () => {
    const { userId } = useDietitianConnection();
    const activeUserId = normalizeSessionUserId(userId);
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [mutationError, setMutationError] = useState(null);
    const [input, setInputState] = useState('');
    const [inputError, setInputError] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [pendingItemIds, setPendingItemIds] = useState({});
    const itemsRef = useRef([]);
    const isMountedRef = useRef(true);
    const isFocusedRef = useRef(false);
    const previousUserIdRef = useRef(activeUserId);
    const sessionGenerationRef = useRef(0);
    const requestSequenceRef = useRef(0);
    const inFlightLoadRef = useRef(null);
    const addRequestRef = useRef(null);
    const itemMutationLocksRef = useRef(new Set());
    const itemMutationVersionsRef = useRef(new Map());
    const mutationSequenceRef = useRef(0);

    const commitItems = useCallback((nextItems) => {
        const sortedItems = sortGroceryItems(nextItems);
        itemsRef.current = sortedItems;
        setItems(sortedItems);
    }, []);

    const markItemPending = useCallback((itemId, pending) => {
        setPendingItemIds((current) => {
            if (pending && current[itemId]) return current;
            if (!pending && !current[itemId]) return current;
            const next = { ...current };
            if (pending) next[itemId] = true;
            else delete next[itemId];
            return next;
        });
    }, []);

    useEffect(() => {
        if (!hasSessionChanged(previousUserIdRef.current, activeUserId)) return;

        previousUserIdRef.current = activeUserId;
        sessionGenerationRef.current += 1;
        requestSequenceRef.current += 1;
        inFlightLoadRef.current = null;
        addRequestRef.current = null;
        itemMutationLocksRef.current.clear();
        itemMutationVersionsRef.current.clear();
        itemsRef.current = [];

        if (!isMountedRef.current) return;
        setItems([]);
        setStatus(activeUserId ? 'loading' : 'empty');
        setError(null);
        setMutationError(null);
        setInputState('');
        setInputError(null);
        setIsAdding(false);
        setPendingItemIds({});
    }, [activeUserId]);

    useEffect(() => () => {
        isMountedRef.current = false;
        sessionGenerationRef.current += 1;
        requestSequenceRef.current += 1;
        inFlightLoadRef.current = null;
        addRequestRef.current = null;
        itemMutationLocksRef.current.clear();
        itemMutationVersionsRef.current.clear();
    }, []);

    const loadItems = useCallback(({ retry = false, force = false } = {}) => {
        if (!activeUserId) {
            commitItems([]);
            setStatus('empty');
            setError(null);
            return Promise.resolve([]);
        }
        if (inFlightLoadRef.current && !force) return inFlightLoadRef.current;

        const requestSequence = requestSequenceRef.current + 1;
        requestSequenceRef.current = requestSequence;
        const requestGeneration = sessionGenerationRef.current;
        const requestUserId = activeUserId;
        if (isMountedRef.current) {
            setStatus(retry ? 'retrying' : 'loading');
            setError(null);
            commitItems([]);
        }

        const isCurrentRequest = () => isMountedRef.current
            && isFocusedRef.current
            && isGroceryLoadCurrent({
                requestGeneration,
                currentGeneration: sessionGenerationRef.current,
                requestSequence,
                currentSequence: requestSequenceRef.current,
                requestUserId,
                activeUserId,
            });

        const request = fetchGroceryItems()
            .then((nextItems) => {
                if (!isCurrentRequest()) return nextItems;
                commitItems(nextItems);
                setStatus(nextItems.length > 0 ? 'ready' : 'empty');
                setError(null);
                return nextItems;
            })
            .catch((loadError) => {
                if (!isCurrentRequest()) return null;
                commitItems([]);
                setStatus('error');
                setError(loadError?.message || GROCERY_LOAD_ERROR_MESSAGE);
                return null;
            })
            .finally(() => {
                if (inFlightLoadRef.current === request) inFlightLoadRef.current = null;
            });

        inFlightLoadRef.current = request;
        return request;
    }, [activeUserId, commitItems]);

    useFocusEffect(
        useCallback(() => {
            isFocusedRef.current = true;
            void loadItems({ force: true });
            return () => {
                isFocusedRef.current = false;
                requestSequenceRef.current += 1;
                inFlightLoadRef.current = null;
            };
        }, [loadItems]),
    );

    const retryItems = useCallback(() => loadItems({ retry: true, force: true }), [loadItems]);

    const setInput = useCallback((value) => {
        setInputState(value);
        if (inputError) setInputError(null);
        if (mutationError) setMutationError(null);
    }, [inputError, mutationError]);

    const addItem = useCallback(async () => {
        if (addRequestRef.current) return { ok: false, busy: true };

        const normalizedName = normalizeGroceryName(input);
        if (!normalizedName) {
            setInputError(GROCERY_NAME_VALIDATION_MESSAGE);
            return { ok: false, invalid: true };
        }
        if (!activeUserId) {
            setMutationError('Oturumunuz doğrulanamadı. Lütfen tekrar giriş yapın.');
            return { ok: false };
        }

        const request = {
            id: mutationSequenceRef.current + 1,
            generation: sessionGenerationRef.current,
            userId: activeUserId,
        };
        mutationSequenceRef.current = request.id;
        addRequestRef.current = request;
        requestSequenceRef.current += 1;
        setIsAdding(true);
        setInputError(null);
        setMutationError(null);

        const isCurrentRequest = () => isMountedRef.current
            && isFocusedRef.current
            && addRequestRef.current === request
            && isGroceryMutationCurrent({
                mutationGeneration: request.generation,
                currentGeneration: sessionGenerationRef.current,
                mutationId: request.id,
                activeMutationId: addRequestRef.current?.id,
                mutationUserId: request.userId,
                activeUserId,
            });

        try {
            const persistedItem = await createGroceryItem(normalizedName);
            if (!isCurrentRequest()) return { ok: false, stale: true };
            commitItems([...itemsRef.current, persistedItem]);
            setStatus('ready');
            setInputState('');
            setInputError(null);
            return { ok: true, item: persistedItem };
        } catch (addError) {
            if (!isCurrentRequest()) return { ok: false, stale: true };
            setMutationError(addError?.message || GROCERY_MUTATION_ERROR_MESSAGE);
            return { ok: false, error: addError };
        } finally {
            if (addRequestRef.current !== request) return;
            addRequestRef.current = null;
            if (isMountedRef.current && sessionGenerationRef.current === request.generation) {
                setIsAdding(false);
            }
        }
    }, [activeUserId, commitItems, input]);

    const toggleItem = useCallback(async (itemId) => {
        if (!itemId || itemMutationLocksRef.current.has(itemId)) return { ok: false, busy: true };
        const previousItem = itemsRef.current.find((item) => item.id === itemId);
        if (!previousItem) return { ok: false, missing: true };
        if (!activeUserId) return { ok: false };

        const request = {
            id: mutationSequenceRef.current + 1,
            itemId,
            generation: sessionGenerationRef.current,
            userId: activeUserId,
        };
        mutationSequenceRef.current = request.id;
        itemMutationLocksRef.current.add(itemId);
        itemMutationVersionsRef.current.set(itemId, request.id);
        markItemPending(itemId, true);
        setMutationError(null);
        requestSequenceRef.current += 1;

        commitItems(replaceGroceryItem(itemsRef.current, {
            ...previousItem,
            isCompleted: !previousItem.isCompleted,
        }));

        const isCurrentRequest = () => isMountedRef.current
            && isFocusedRef.current
            && itemMutationLocksRef.current.has(itemId)
            && itemMutationVersionsRef.current.get(itemId) === request.id
            && isGroceryMutationCurrent({
                mutationGeneration: request.generation,
                currentGeneration: sessionGenerationRef.current,
                mutationId: request.id,
                activeMutationId: itemMutationVersionsRef.current.get(itemId),
                mutationUserId: request.userId,
                activeUserId,
            });

        try {
            const persistedItem = await updateGroceryItemCompletion(itemId, !previousItem.isCompleted);
            if (!isCurrentRequest()) return { ok: false, stale: true };
            commitItems(replaceGroceryItem(itemsRef.current, persistedItem));
            return { ok: true, item: persistedItem };
        } catch (toggleError) {
            if (!isCurrentRequest()) return { ok: false, stale: true };
            commitItems(replaceGroceryItem(itemsRef.current, previousItem));
            setMutationError(toggleError?.message || GROCERY_MUTATION_ERROR_MESSAGE);
            return { ok: false, error: toggleError };
        } finally {
            if (itemMutationVersionsRef.current.get(itemId) !== request.id) return;
            itemMutationLocksRef.current.delete(itemId);
            itemMutationVersionsRef.current.delete(itemId);
            markItemPending(itemId, false);
        }
    }, [activeUserId, commitItems, markItemPending]);

    const deleteItem = useCallback(async (itemId) => {
        if (!itemId || itemMutationLocksRef.current.has(itemId)) return { ok: false, busy: true };
        const previousItem = itemsRef.current.find((item) => item.id === itemId);
        if (!previousItem) return { ok: false, missing: true };
        if (!activeUserId) return { ok: false };

        const request = {
            id: mutationSequenceRef.current + 1,
            itemId,
            generation: sessionGenerationRef.current,
            userId: activeUserId,
        };
        mutationSequenceRef.current = request.id;
        itemMutationLocksRef.current.add(itemId);
        itemMutationVersionsRef.current.set(itemId, request.id);
        markItemPending(itemId, true);
        setMutationError(null);
        requestSequenceRef.current += 1;

        const previousIndex = itemsRef.current.findIndex((item) => item.id === itemId);
        const nextItems = removeGroceryItem(itemsRef.current, itemId);
        commitItems(nextItems);
        setStatus(nextItems.length > 0 ? 'ready' : 'empty');

        const isCurrentRequest = () => isMountedRef.current
            && isFocusedRef.current
            && itemMutationLocksRef.current.has(itemId)
            && itemMutationVersionsRef.current.get(itemId) === request.id
            && isGroceryMutationCurrent({
                mutationGeneration: request.generation,
                currentGeneration: sessionGenerationRef.current,
                mutationId: request.id,
                activeMutationId: itemMutationVersionsRef.current.get(itemId),
                mutationUserId: request.userId,
                activeUserId,
            });

        try {
            await deleteGroceryItem(itemId);
            if (!isCurrentRequest()) return { ok: false, stale: true };
            return { ok: true, itemId };
        } catch (deleteError) {
            if (!isCurrentRequest()) return { ok: false, stale: true };
            const restoredItems = restoreGroceryItem(itemsRef.current, previousItem, previousIndex);
            commitItems(restoredItems);
            setStatus('ready');
            setMutationError(deleteError?.message || GROCERY_MUTATION_ERROR_MESSAGE);
            return { ok: false, error: deleteError };
        } finally {
            if (itemMutationVersionsRef.current.get(itemId) !== request.id) return;
            itemMutationLocksRef.current.delete(itemId);
            itemMutationVersionsRef.current.delete(itemId);
            markItemPending(itemId, false);
        }
    }, [activeUserId, commitItems, markItemPending]);

    return {
        items,
        status,
        error,
        mutationError,
        input,
        setInput,
        inputError,
        isAdding,
        pendingItemIds,
        isLoading: status === 'loading' || status === 'retrying',
        loadItems,
        retryItems,
        addItem,
        toggleItem,
        deleteItem,
    };
};

export default useGroceryListViewModel;
