import { meals, getDayOptions } from '../../../constants/dietData';

/**
 * Fetches the list of meals.
 * Currently returns static data, but can be replaced with API call.
 * @returns {Promise<Array>}
 */
export const getMeals = async () => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(meals);
        }, 100);
    });
};

/**
 * Fetches the available day options.
 * @returns {Array<string>}
 */
export const getDays = () => {
    return getDayOptions() ?? [];
};

/**
 * Sends a meal change request.
 * @param {object} requestData
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendMealChangeRequest = async (requestData) => {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('Meal change request sent:', requestData);
            resolve({ success: true, message: 'Öğün değişikliği talebiniz diyetisyeninize iletildi.' });
        }, 500);
    });
};
