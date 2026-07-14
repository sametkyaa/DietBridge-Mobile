import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { updateMealCompletion } from '../services/mealService';

const defaultContext = {
    completedMeals: {},
    hydrateCompletedMeals: () => { },
    toggleMealCompletion: async () => null,
};

const MealsContext = createContext(defaultContext);

export const MealsProvider = ({ children }) => {
    const [completedMeals, setCompletedMeals] = useState({});
    const completedMealsRef = useRef({});

    const setCompletedMealsState = useCallback((nextCompletedMeals) => {
        completedMealsRef.current = nextCompletedMeals;
        setCompletedMeals(nextCompletedMeals);
    }, []);

    const hydrateCompletedMeals = useCallback((meals = []) => {
        const next = { ...completedMealsRef.current };

        meals.forEach((meal) => {
            if (!meal?.id) return;

            if (meal.is_eaten) {
                const current = next[meal.id];
                next[meal.id] = {
                    completed: true,
                    photoUri: current?.photoUri || meal.photo_url || null,
                };
            } else {
                delete next[meal.id];
            }
        });

        setCompletedMealsState(next);
    }, [setCompletedMealsState]);

    const toggleMealCompletion = useCallback(async (mealId, options = {}) => {
        if (!mealId) {
            throw new Error('Geçerli öğün ID bulunamadı.');
        }

        const normalizedOptions = typeof options === 'object' && options !== null
            ? options
            : { photoUri: options };
        const previous = completedMealsRef.current;
        const wasCompleted = !!previous[mealId]?.completed;
        const shouldComplete = normalizedOptions.completed ?? !wasCompleted;
        const next = { ...previous };

        if (shouldComplete) {
            next[mealId] = {
                completed: true,
                photoUri: normalizedOptions.photoUri ?? previous[mealId]?.photoUri ?? null,
            };
        } else {
            delete next[mealId];
        }

        setCompletedMealsState(next);

        try {
            const updatedMeal = await updateMealCompletion(mealId, shouldComplete);
            return updatedMeal;
        } catch (error) {
            setCompletedMealsState(previous);
            throw error;
        }
    }, [setCompletedMealsState]);

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
