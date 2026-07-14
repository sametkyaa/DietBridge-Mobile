import { supabase } from '../../../lib/supabaseClient';
import {
    getUniqueCaseInsensitiveValues,
    normalizeMultiValue,
} from '../utils/profileValueUtils';

const PROFILE_NOT_FOUND_MESSAGE = 'Profil bilgileri bulunamadı.';
const CLIENT_PROFILE_NOT_FOUND_MESSAGE = 'Danışan profil bilgileri bulunamadı.';
const SESSION_REQUIRED_MESSAGE = 'Kullanıcı oturumu bulunamadı.';
const CLIENT_ONLY_MESSAGE = 'Bu uygulama yalnızca danışan profilleri içindir.';
const PROFILE_UPDATE_FAILED_MESSAGE = 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.';
const PROFILE_UNAVAILABLE_MESSAGE = 'Profil bilgilerine ulaşılamadı.';
const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const AVATAR_UPLOAD_FAILED_MESSAGE = 'Profil fotoğrafı kaydedilemedi. Lütfen tekrar deneyin.';

export const SMOKING_STATUS_OPTIONS = [
    { id: true, code: 'using', label: 'Kullanıyor' },
    { id: false, code: 'not_using', label: 'Kullanmıyor' },
];

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getCurrentUserOrThrow = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error(SESSION_REQUIRED_MESSAGE);
    }
    return user;
};

const cleanString = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
};

const cleanRequiredString = (value, label) => {
    const cleaned = cleanString(value);
    if (!cleaned) throw new Error(`${label} boş bırakılamaz.`);
    return cleaned;
};

const normalizePhone = (value) => {
    const cleaned = cleanString(value);
    if (!cleaned) return null;
    return cleaned.replace(/[^\d+]/g, '');
};

const normalizeDecimal = (value, label, { min, max } = {}) => {
    if (value === undefined) return undefined;
    if (value === null || String(value).trim() === '') return null;

    const numberValue = Number(String(value).replace(',', '.'));
    if (!Number.isFinite(numberValue)) {
        throw new Error(`${label} sayısal olmalıdır.`);
    }
    if (min !== undefined && numberValue < min) {
        throw new Error(`${label} en az ${min} olmalıdır.`);
    }
    if (max !== undefined && numberValue > max) {
        throw new Error(`${label} en fazla ${max} olmalıdır.`);
    }
    return numberValue;
};

const normalizeInteger = (value, label, range) => {
    const normalized = normalizeDecimal(value, label, range);
    if (normalized === undefined || normalized === null) return normalized;
    return Math.round(normalized);
};

const normalizeId = (value) => {
    if (value === undefined) return undefined;
    if (value === null || String(value).trim() === '') return null;

    const cleaned = String(value).trim();
    return /^\d+$/.test(cleaned) ? Number(cleaned) : cleaned;
};

const normalizeBoolean = (value, label) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (typeof value === 'boolean') return value;

    const normalized = String(value).trim().toLocaleLowerCase('tr-TR');
    if (['true', '1', 'evet', 'kullanıyor', 'kullaniyor'].includes(normalized)) return true;
    if (['false', '0', 'hayır', 'hayir', 'kullanmıyor', 'kullanmiyor'].includes(normalized)) return false;
    throw new Error(`${label} için geçerli bir seçenek seçiniz.`);
};

const normalizeList = (value) => {
    if (value === undefined) return undefined;
    return normalizeMultiValue(value);
};

const logProfileUpdateFailure = ({ userId, field, value, error }) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.error('Profile update failed', {
            userId,
            field,
            value,
            error,
        });
    }
};

const normalizeDate = (value, label) => {
    if (value === undefined) return undefined;
    const cleaned = cleanString(value);
    if (!cleaned) return null;

    let isoValue = cleaned;
    const trMatch = cleaned.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (trMatch) {
        const [, day, month, year] = trMatch;
        isoValue = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoValue)) {
        throw new Error(`${label} YYYY-AA-GG biçiminde olmalıdır.`);
    }

    const date = new Date(`${isoValue}T00:00:00`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoValue) {
        throw new Error(`${label} geçerli bir tarih olmalıdır.`);
    }
    if (isoValue > today()) {
        throw new Error(`${label} gelecekte olamaz.`);
    }
    return isoValue;
};

const normalizeSleepRange = ({ sleepHours, sleepHoursMin, sleepHoursMax }) => {
    if (sleepHours === undefined && sleepHoursMin === undefined && sleepHoursMax === undefined) {
        return {};
    }

    if (sleepHours !== undefined && sleepHoursMin === undefined && sleepHoursMax === undefined) {
        const cleaned = cleanString(sleepHours);
        if (!cleaned) return { sleep_hours_min: null, sleep_hours_max: null };

        const parts = cleaned.replace(',', '.').match(/\d+(\.\d+)?/g) || [];
        if (parts.length === 0) throw new Error('Uyku süresi sayısal olmalıdır.');

        const min = normalizeDecimal(parts[0], 'Minimum uyku', { min: 0, max: 24 });
        const max = normalizeDecimal(parts[1] || parts[0], 'Maksimum uyku', { min: 0, max: 24 });
        if (min > max) throw new Error('Minimum uyku maksimum uykudan büyük olamaz.');
        return { sleep_hours_min: min, sleep_hours_max: max };
    }

    const min = normalizeDecimal(sleepHoursMin, 'Minimum uyku', { min: 0, max: 24 });
    const max = normalizeDecimal(sleepHoursMax, 'Maksimum uyku', { min: 0, max: 24 });
    if (min !== null && max !== null && min > max) {
        throw new Error('Minimum uyku maksimum uykudan büyük olamaz.');
    }
    return { sleep_hours_min: min, sleep_hours_max: max };
};

const mapReferenceRows = (rows = [], labelKey = 'label') => (
    rows.map((row) => ({
        id: row.id,
        code: row.code,
        label: row[labelKey] || row.code,
    }))
);

const findReferenceLabel = (items = [], id) => {
    if (id === null || id === undefined) return null;
    const item = items.find((option) => String(option.id) === String(id));
    return item?.label || item?.code || null;
};

const getActiveReferenceRows = async (tableName) => {
    const { data, error } = await supabase
        .from(tableName)
        .select('id, code, label, sort_order, is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) throw error;
    return mapReferenceRows(data || []);
};

export const getProfileReferenceData = async () => {
    const [
        bloodTypesResult,
        activityLevels,
        alcoholStatuses,
        nutritionTypes,
        clientGoals,
    ] = await Promise.all([
        supabase.from('blood_types').select('id, code').order('id', { ascending: true }),
        getActiveReferenceRows('activity_levels'),
        getActiveReferenceRows('alcohol_statuses'),
        getActiveReferenceRows('nutrition_types'),
        getActiveReferenceRows('client_goals'),
    ]);

    if (bloodTypesResult.error) throw bloodTypesResult.error;

    return {
        bloodTypes: mapReferenceRows(bloodTypesResult.data || [], 'code'),
        activityLevels,
        alcoholStatuses,
        nutritionTypes,
        clientGoals,
        smokingStatuses: SMOKING_STATUS_OPTIONS,
    };
};

export const getAvatarSignedUrl = async (path) => {
    const objectPath = cleanString(path);
    if (!objectPath) return null;

    const { data, error } = await supabase
        .storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(objectPath, 60 * 60);

    if (error) throw error;
    return data?.signedUrl || null;
};

const normalizeProfileResult = async ({ user, profile, clientProfile, referenceData }) => {
    const avatarSignedUrl = profile.avatar_url
        ? await getAvatarSignedUrl(profile.avatar_url).catch(() => null)
        : null;
    const chronicConditions = normalizeMultiValue(clientProfile.chronic_conditions);
    const medications = normalizeMultiValue(clientProfile.medications);
    const foodIntolerances = normalizeMultiValue(clientProfile.food_intolerances);
    const dislikedFoods = normalizeMultiValue(clientProfile.disliked_foods);

    return {
        id: profile.id,
        email: user.email || profile.email || null,
        fullName: profile.full_name || null,
        phone: profile.phone || null,
        avatarPath: profile.avatar_url || null,
        avatarSignedUrl,
        avatarUrl: avatarSignedUrl,
        role: profile.role,
        heightCm: clientProfile.height_cm ?? null,
        currentWeight: clientProfile.current_weight ?? null,
        targetWeight: clientProfile.target_weight ?? null,
        complianceScore: clientProfile.compliance_score ?? null,
        chronicConditions,
        medications,
        bloodTypeId: clientProfile.blood_type_id ?? null,
        bloodTypeLabel: findReferenceLabel(referenceData.bloodTypes, clientProfile.blood_type_id),
        lastLabDate: clientProfile.last_lab_date || null,
        sleepHoursMin: clientProfile.sleep_hours_min ?? null,
        sleepHoursMax: clientProfile.sleep_hours_max ?? null,
        activityLevelId: clientProfile.activity_level_id ?? null,
        activityLevelLabel: findReferenceLabel(referenceData.activityLevels, clientProfile.activity_level_id),
        smokingStatus: clientProfile.smoking_status ?? null,
        smokingStatusLabel:
            clientProfile.smoking_status === null || clientProfile.smoking_status === undefined
                ? null
                : (clientProfile.smoking_status ? 'Kullanıyor' : 'Kullanmıyor'),
        alcoholStatusId: clientProfile.alcohol_status_id ?? null,
        alcoholStatusLabel: findReferenceLabel(referenceData.alcoholStatuses, clientProfile.alcohol_status_id),
        nutritionTypeId: clientProfile.nutrition_type_id ?? null,
        nutritionTypeLabel: findReferenceLabel(referenceData.nutritionTypes, clientProfile.nutrition_type_id),
        goalId: clientProfile.goal_id ?? null,
        goalLabel: findReferenceLabel(referenceData.clientGoals, clientProfile.goal_id),
        foodIntolerances,
        dislikedFoods,
        dailyWaterGoalMl: clientProfile.daily_water_goal_ml ?? null,

        // Backward-compatible aliases used by existing dashboard/profile code.
        height_cm: clientProfile.height_cm ?? null,
        current_weight: clientProfile.current_weight ?? null,
        target_weight: clientProfile.target_weight ?? null,
        compliance_score: clientProfile.compliance_score ?? null,
        chronicConditionsList: chronicConditions.map((name) => ({ name })),
        medicationsList: medications.map((name) => ({ name })),
        last_lab_date: clientProfile.last_lab_date || null,
        sleep_hours_min: clientProfile.sleep_hours_min ?? null,
        sleep_hours_max: clientProfile.sleep_hours_max ?? null,
        daily_water_goal_ml: clientProfile.daily_water_goal_ml ?? null,
    };
};

export const getCurrentUserProfile = async () => {
    const user = await getCurrentUserOrThrow();

    const [profileResult, clientProfileResult, referenceData] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, email, full_name, phone, avatar_url, role, created_at, updated_at')
            .eq('id', user.id)
            .maybeSingle(),
        supabase
            .from('client_profiles')
            .select(`
                user_id,
                height_cm,
                current_weight,
                target_weight,
                compliance_score,
                chronic_conditions,
                medications,
                blood_type_id,
                last_lab_date,
                sleep_hours_min,
                sleep_hours_max,
                activity_level_id,
                smoking_status,
                alcohol_status_id,
                nutrition_type_id,
                goal_id,
                food_intolerances,
                disliked_foods,
                daily_water_goal_ml,
                created_at,
                updated_at
            `)
            .eq('user_id', user.id)
            .maybeSingle(),
        getProfileReferenceData(),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (clientProfileResult.error) throw clientProfileResult.error;
    if (!profileResult.data) throw new Error(PROFILE_NOT_FOUND_MESSAGE);
    if (profileResult.data.role !== 'client') throw new Error(CLIENT_ONLY_MESSAGE);
    if (!clientProfileResult.data) throw new Error(CLIENT_PROFILE_NOT_FOUND_MESSAGE);

    return normalizeProfileResult({
        user,
        profile: profileResult.data,
        clientProfile: clientProfileResult.data,
        referenceData,
    });
};

export const getClientProfile = async () => getCurrentUserProfile();

export const updateCurrentUserProfile = async (payload = {}) => {
    const user = await getCurrentUserOrThrow();
    const profileUpdates = {};
    const clientUpdates = {};

    if (payload.fullName !== undefined) {
        profileUpdates.full_name = cleanRequiredString(payload.fullName, 'Ad soyad');
    }
    if (payload.phone !== undefined) {
        profileUpdates.phone = normalizePhone(payload.phone);
    }
    if (payload.avatarPath !== undefined || payload.avatarUrl !== undefined) {
        const avatarValue = Object.prototype.hasOwnProperty.call(payload, 'avatarPath')
            ? payload.avatarPath
            : payload.avatarUrl;
        profileUpdates.avatar_url = cleanString(avatarValue);
    }

    if (payload.heightCm !== undefined) {
        clientUpdates.height_cm = normalizeDecimal(payload.heightCm, 'Boy', { min: 50, max: 250 });
    }
    if (payload.targetWeight !== undefined) {
        clientUpdates.target_weight = normalizeDecimal(payload.targetWeight, 'Hedef kilo', { min: 20, max: 500 });
    }
    if (payload.bloodTypeId !== undefined) clientUpdates.blood_type_id = normalizeId(payload.bloodTypeId);
    if (payload.lastLabDate !== undefined) clientUpdates.last_lab_date = normalizeDate(payload.lastLabDate, 'Son tahlil tarihi');
    if (payload.activityLevelId !== undefined) clientUpdates.activity_level_id = normalizeId(payload.activityLevelId);
    if (payload.smokingStatus !== undefined) clientUpdates.smoking_status = normalizeBoolean(payload.smokingStatus, 'Sigara kullanımı');
    if (payload.alcoholStatusId !== undefined) clientUpdates.alcohol_status_id = normalizeId(payload.alcoholStatusId);
    if (payload.nutritionTypeId !== undefined) clientUpdates.nutrition_type_id = normalizeId(payload.nutritionTypeId);
    if (payload.goalId !== undefined) clientUpdates.goal_id = normalizeId(payload.goalId);

    const chronicConditions = normalizeList(payload.chronicConditions);
    const medications = normalizeList(payload.medications);
    const foodIntolerances = normalizeList(payload.foodIntolerances);
    const dislikedFoods = normalizeList(payload.dislikedFoods);

    if (chronicConditions !== undefined) clientUpdates.chronic_conditions = chronicConditions;
    if (medications !== undefined) clientUpdates.medications = medications;
    if (foodIntolerances !== undefined) clientUpdates.food_intolerances = foodIntolerances;
    if (dislikedFoods !== undefined) clientUpdates.disliked_foods = dislikedFoods;
    if (payload.dailyWaterGoalMl !== undefined) {
        clientUpdates.daily_water_goal_ml = normalizeInteger(payload.dailyWaterGoalMl, 'Günlük su hedefi', { min: 250, max: 10000 });
    }

    Object.assign(clientUpdates, normalizeSleepRange(payload));

    if (Object.keys(profileUpdates).length > 0) {
        const { data, error } = await supabase
            .from('profiles')
            .update(profileUpdates)
            .eq('id', user.id)
            .select('id')
            .maybeSingle();

        if (error) {
            logProfileUpdateFailure({
                userId: user.id,
                field: Object.keys(profileUpdates).join(', '),
                value: profileUpdates,
                error,
            });
            throw new Error(PROFILE_UPDATE_FAILED_MESSAGE);
        }
        if (!data) throw new Error(PROFILE_UNAVAILABLE_MESSAGE);
    }

    if (Object.keys(clientUpdates).length > 0) {
        const { data, error } = await supabase
            .from('client_profiles')
            .update(clientUpdates)
            .eq('user_id', user.id)
            .select('user_id')
            .maybeSingle();

        if (error) {
            logProfileUpdateFailure({
                userId: user.id,
                field: Object.keys(clientUpdates).join(', '),
                value: clientUpdates,
                error,
            });
            throw new Error(PROFILE_UPDATE_FAILED_MESSAGE);
        }
        if (!data) throw new Error(PROFILE_UNAVAILABLE_MESSAGE);
    }

    if (payload.currentWeight !== undefined) {
        await saveCurrentWeight(payload.currentWeight);
    }

    return getCurrentUserProfile();
};

const matchesStep = (value, minimum, step) => {
    if (value === null || value === undefined || !step) return true;
    const stepCount = (value - minimum) / step;
    return Math.abs(stepCount - Math.round(stepCount)) < 0.000001;
};

const updateProfileHealthField = async ({ payloadField, databaseField, value }) => {
    let user;

    try {
        user = await getCurrentUserOrThrow();
        return await updateCurrentUserProfile({ [payloadField]: value });
    } catch (error) {
        logProfileUpdateFailure({
            userId: user?.id || null,
            field: databaseField,
            value,
            error,
        });

        if (
            error?.message === SESSION_REQUIRED_MESSAGE
            || error?.message === PROFILE_NOT_FOUND_MESSAGE
            || error?.message === CLIENT_PROFILE_NOT_FOUND_MESSAGE
            || error?.message === PROFILE_UNAVAILABLE_MESSAGE
        ) {
            throw new Error(PROFILE_UNAVAILABLE_MESSAGE);
        }

        if (error?.message === PROFILE_UPDATE_FAILED_MESSAGE) throw error;
        throw new Error(PROFILE_UPDATE_FAILED_MESSAGE);
    }
};

export const updateChronicConditions = async (values) => updateProfileHealthField({
    payloadField: 'chronicConditions',
    databaseField: 'chronic_conditions',
    value: getUniqueCaseInsensitiveValues(normalizeMultiValue(values)),
});

export const updateMedications = async (values) => updateProfileHealthField({
    payloadField: 'medications',
    databaseField: 'medications',
    value: getUniqueCaseInsensitiveValues(normalizeMultiValue(values)),
});

export const updateFoodIntolerances = async (values) => updateProfileHealthField({
    payloadField: 'foodIntolerances',
    databaseField: 'food_intolerances',
    value: getUniqueCaseInsensitiveValues(normalizeMultiValue(values)),
});

export const updateWaterGoal = async (liters) => {
    const normalizedLiters = normalizeDecimal(liters, 'Su hedefi', { min: 0.5, max: 10 });
    if (normalizedLiters !== null && normalizedLiters !== undefined && !matchesStep(normalizedLiters, 0.5, 0.1)) {
        throw new Error('Lütfen 0.5 ile 10 litre arasında geçerli bir değer girin.');
    }

    const milliliters = normalizedLiters === null || normalizedLiters === undefined
        ? normalizedLiters
        : Math.round(normalizedLiters * 1000);

    return updateProfileHealthField({
        payloadField: 'dailyWaterGoalMl',
        databaseField: 'daily_water_goal_ml',
        value: milliliters,
    });
};

export const updateSleepHours = async (hours) => {
    const normalizedHours = normalizeDecimal(hours, 'Uyku süresi', { min: 0, max: 24 });
    if (normalizedHours !== null && normalizedHours !== undefined && !matchesStep(normalizedHours, 0, 0.5)) {
        throw new Error('Lütfen 0 ile 24 saat arasında geçerli bir değer girin.');
    }

    return updateProfileHealthField({
        payloadField: 'sleepHours',
        databaseField: 'sleep_hours_min, sleep_hours_max',
        value: normalizedHours,
    });
};

export const saveCurrentWeight = async (weight) => {
    const numericWeight = normalizeDecimal(weight, 'Güncel kilo', { min: 20, max: 500 });
    if (numericWeight === null || numericWeight === undefined) {
        throw new Error('Güncel kilo boş bırakılamaz.');
    }

    const { error } = await supabase.rpc('save_my_current_weight', {
        p_weight: numericWeight,
    });

    if (error) throw error;
    return getCurrentUserProfile();
};

const getAvatarMimeType = (asset) => {
    const declaredMimeType = String(asset?.mimeType || '').trim().toLowerCase();
    if (declaredMimeType === 'image/jpg') return 'image/jpeg';
    if (declaredMimeType) return declaredMimeType;

    const fileName = String(asset?.fileName || asset?.uri || '').split('?')[0].toLowerCase();
    if (fileName.endsWith('.png')) return 'image/png';
    if (fileName.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
};

const readAvatarAsArrayBuffer = (uri) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('GET', uri, true);
    request.responseType = 'arraybuffer';
    request.timeout = 15000;

    request.onload = () => {
        const fileData = request.response;
        if (!fileData || !Number.isFinite(fileData.byteLength) || fileData.byteLength === 0) {
            reject(new Error('Avatar file could not be read.'));
            return;
        }

        resolve(fileData);
    };

    request.onerror = () => reject(new Error('Avatar file could not be read.'));
    request.ontimeout = () => reject(new Error('Avatar file read timed out.'));
    request.send(null);
});

export const uploadProfileAvatar = async (asset) => {
    const user = await getCurrentUserOrThrow();
    if (!asset?.uri) throw new Error('Yüklenecek profil fotoğrafı bulunamadı.');

    const mimeType = getAvatarMimeType(asset);
    if (!ALLOWED_AVATAR_TYPES.includes(mimeType)) {
        throw new Error('Profil fotoğrafı JPEG, PNG veya WebP olmalıdır.');
    }
    if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
        throw new Error('Profil fotoğrafı en fazla 5 MB olabilir.');
    }

    const extensionMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    };
    const filePath = `${user.id}/avatar.${extensionMap[mimeType] || 'jpg'}`;

    try {
        const fileData = await readAvatarAsArrayBuffer(asset.uri);

        if (fileData.byteLength > MAX_AVATAR_BYTES) {
            throw new Error('Profil fotoğrafı en fazla 5 MB olabilir.');
        }

        const { error: uploadError } = await supabase
            .storage
            .from(AVATAR_BUCKET)
            .upload(filePath, fileData, {
                contentType: mimeType,
                upsert: true,
            });

        if (uploadError) throw uploadError;
        return await updateCurrentUserProfile({ avatarPath: filePath });
    } catch (error) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.error('Profile avatar upload failed', {
                userId: user.id,
                mimeType,
                error,
            });
        }

        if (error?.message === 'Profil fotoğrafı en fazla 5 MB olabilir.') throw error;
        throw new Error(AVATAR_UPLOAD_FAILED_MESSAGE);
    }
};

export const deleteProfileAvatar = async () => {
    const profile = await getCurrentUserProfile();
    if (profile.avatarPath) {
        const { error: removeError } = await supabase
            .storage
            .from(AVATAR_BUCKET)
            .remove([profile.avatarPath]);

        if (removeError) throw removeError;
    }

    await updateCurrentUserProfile({ avatarPath: null });
    return getCurrentUserProfile();
};

export const updateClientProfile = async (updates = {}) => updateCurrentUserProfile(updates);
export const uploadMyAvatar = async (asset) => uploadProfileAvatar(asset);
export const saveMyWeightMeasurement = async ({ weight } = {}) => saveCurrentWeight(weight);

export const getBloodTypes = async () => (await getProfileReferenceData()).bloodTypes;
export const getMedicalConditions = async () => [];
export const getMedicationsCatalog = async () => [];

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getDailyQuote = () => {
    const quotes = [
        'Bugün iyi seçimler için yeni bir gün.',
        'Sağlıklı beslen, iyi hisset.',
        'Her adım seni hedefine yaklaştırır.',
        'Su içmeyi unutma.',
        'Küçük alışkanlıklar büyük sonuçlar getirir.',
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
};
