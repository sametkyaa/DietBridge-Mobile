import supabase from '../../../../lib/supabase';

/**
 * Fetches the current user's profile information.
 * @returns {Promise<{user: any, error: any}>}
 */
export const getUserProfile = async () => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    } catch (error) {
        return { user: null, error };
    }
};

/**
 * Signs out the current user.
 * @returns {Promise<{error: any}>}
 */
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        return { error };
    } catch (error) {
        return { error };
    }
};
