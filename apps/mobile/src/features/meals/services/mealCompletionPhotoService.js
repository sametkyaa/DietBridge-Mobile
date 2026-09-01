import * as Crypto from 'expo-crypto';
import { supabase } from '../../../lib/supabaseClient';
import { canonicalizeChatImage } from '../../chat/utils/canonicalizeChatImage';
import { createExpoCanonicalizerDeps } from '../../chat/services/chatImagePicker';
import {
    uploadAndCompleteMealWithPhoto,
} from './mealCompletionPhotoUploadLifecycle.cjs';

const enqueueUnreferencedCompletionPhoto = async (objectPath) => {
    const { error } = await supabase.rpc('enqueue_my_unreferenced_meal_completion_photo_cleanup', {
        p_object_path: objectPath,
    });
    if (error) throw error;
};

// Completion photos use the existing canonical JPEG pipeline, but have their
// own bucket/path and final completion RPC. The local picker URI is never sent
// to Supabase and the canonical Storage path is returned only after both
// Storage and the completion RPC succeed.
export const completeMealWithPhoto = async (mealId, source) => uploadAndCompleteMealWithPhoto({
    mealId,
    source,
    getUser: () => supabase.auth.getUser(),
    canonicalize: canonicalizeChatImage,
    canonicalizerDeps: createExpoCanonicalizerDeps(),
    randomUUID: () => Crypto.randomUUID(),
    storage: supabase.storage,
    rpc: (functionName, params) => supabase.rpc(functionName, params),
    enqueueCleanup: enqueueUnreferencedCompletionPhoto,
});

export default completeMealWithPhoto;
