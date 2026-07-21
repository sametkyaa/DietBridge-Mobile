import React from 'react';
import { MealDetailSheet } from '../../../meals/components/MealDetailSheet';

export function DashboardMealDetailSheet({ meal, visible, onClose, bottomInset }) {
    return (
        <MealDetailSheet
            meal={meal}
            completion={{
                completed: meal?.status === 'completed' || !!meal?.isEaten,
                completionPhotoUri: meal?.completionPhotoUri || null,
            }}
            visible={visible}
            onClose={onClose}
            bottomInset={bottomInset}
        />
    );
}

export default DashboardMealDetailSheet;
