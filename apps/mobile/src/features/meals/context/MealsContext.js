import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { updateMealCompletion } from '../services/mealService';
const { hasMealSessionChanged, normalizeSessionUserId } = require('./mealSessionIsolation.cjs');

const defaultContext = {
    completedMeals: {},
    hydrateCompletedMeals: () => { },
    toggleMealCompletion: async () => null,
};

const MealsContext = createContext(defaultContext);

export const MealsProvider = ({ children, userId = null }) => {
    const [completedMeals, setCompletedMeals] = useState({});
    const completedMealsRef = useRef({});
    const completionRequestVersionsRef = useRef({});
    const sessionGenerationRef = useRef(0);
    const previousUserIdRef = useRef(normalizeSessionUserId(userId));

    useEffect(() => {
        const nextUserId = normalizeSessionUserId(userId);
        if (!hasMealSessionChanged(previousUserIdRef.current, nextUserId)) return;

        // This provider remains mounted while App switches between the Auth
        // and client navigators. Never carry protected A state into B.
        previousUserIdRef.current = nextUserId;
        sessionGenerationRef.current += 1;
        completedMealsRef.current = {};
        completionRequestVersionsRef.current = {};
        setCompletedMeals({});
    }, [userId]);

    const setCompletedMealsState = useCallback((nextCompletedMeals) => {
        const currentCompletedMeals = completedMealsRef.current;
        const nextState = typeof nextCompletedMeals === 'function'
            ? nextCompletedMeals(currentCompletedMeals)
            : nextCompletedMeals;

        completedMealsRef.current = nextState;
        setCompletedMeals(nextState);
        return nextState;
    }, []);

    const updateMealCompletionState = useCallback((mealId, completion) => {
        return setCompletedMealsState((currentCompletedMeals) => {
            const nextCompletedMeals = { ...currentCompletedMeals };

            if (completion) {
                nextCompletedMeals[mealId] = completion;
            } else {
                delete nextCompletedMeals[mealId];
            }

            return nextCompletedMeals;
        });
    }, [setCompletedMealsState]);

    const hydrateCompletedMeals = useCallback((meals = []) => {
        setCompletedMealsState((currentCompletedMeals) => {
            const next = { ...currentCompletedMeals };

            meals.forEach((meal) => {
                if (!meal?.id) return;

                if (meal.isEaten) {
                    const current = next[meal.id];
                    next[meal.id] = {
                        completed: true,
                        // Canonical photoPath is a private DB path. Only a device completion
                        // photo may be rendered here until WP5.3C2 resolves signed URLs.
                        completionPhotoUri: current?.completionPhotoUri || null,
                    };
                } else {
                    delete next[meal.id];
                }
            });

            return next;
        });
    }, [setCompletedMealsState]);

    const toggleMealCompletion = useCallback(async (mealId, options = {}) => {
        if (!mealId) {
            throw new Error('Geçerli öğün ID bulunamadı.');
        }

        const normalizedOptions = typeof options === 'object' && options !== null
            ? options
            : { completionPhotoUri: options };
        const previousCompletion = completedMealsRef.current[mealId];
        const wasCompleted = !!previousCompletion?.completed;
        const shouldComplete = normalizedOptions.completed ?? !wasCompleted;
        const requestVersion = (completionRequestVersionsRef.current[mealId] || 0) + 1;
        const requestGeneration = sessionGenerationRef.current;

        completionRequestVersionsRef.current[mealId] = requestVersion;
        updateMealCompletionState(mealId, shouldComplete
            ? {
                completed: true,
                completionPhotoUri: normalizedOptions.completionPhotoUri
                    ?? previousCompletion?.completionPhotoUri
                    ?? null,
            }
            : null);

        try {
            return await updateMealCompletion(mealId, shouldComplete);
        } catch (error) {
            if (sessionGenerationRef.current === requestGeneration
                && completionRequestVersionsRef.current[mealId] === requestVersion) {
                updateMealCompletionState(mealId, previousCompletion);
            }

            throw error;
        }
    }, [updateMealCompletionState]);

    const value = useMemo(() => ({
        completedMeals,
        hydrateCompletedMeals,
        toggleMealCompletion,
    }), [completedMeals, hydrateCompletedMeals, toggleMealCompletion]);

    return (
        <MealsContext.Provider value={value}>
            {children}
        </MealsContext.Provider>
    );
};

export const useMeals = () => useContext(MealsContext);
