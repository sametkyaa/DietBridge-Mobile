import React, { createContext, useContext, useState } from 'react';

const defaultContext = {
  completedMeals: {},
  toggleMealCompletion: () => {},
};

const MealsContext = createContext(defaultContext);

export const MealsProvider = ({ children }) => {
  const [completedMeals, setCompletedMeals] = useState({});

  const toggleMealCompletion = (mealType, photoUri = null) => {
    setCompletedMeals((prev) => {
      const next = { ...prev };
      if (next[mealType]?.completed) {
        delete next[mealType];
      } else {
        next[mealType] = { completed: true, photoUri };
      }
      return next;
    });
  };

  return (
    <MealsContext.Provider value={{ completedMeals, toggleMealCompletion }}>
      {children}
    </MealsContext.Provider>
  );
};

export const useMeals = () => useContext(MealsContext);
