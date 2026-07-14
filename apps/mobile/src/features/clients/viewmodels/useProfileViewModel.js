import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import {
    deleteProfileAvatar,
    getCurrentUserProfile,
    getProfileReferenceData,
    signOut,
    updateChronicConditions,
    updateCurrentUserProfile,
    updateFoodIntolerances,
    updateMedications,
    updateSleepHours,
    updateWaterGoal,
    uploadProfileAvatar,
} from '../services/clientService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import {
    formatDecimalValue,
    getAverageSleepHours,
    normalizeMultiValue,
} from '../utils/profileValueUtils';

const EMPTY_TEXT = '';
const EMPTY_NAME = '';
const EMPTY_MEASUREMENT = '';
const EMPTY_DIETITIAN = 'Henüz diyetisyen atanmamış';

const INITIAL_REFERENCE_DATA = {
    bloodTypes: [],
    activityLevels: [],
    alcoholStatuses: [],
    nutritionTypes: [],
    clientGoals: [],
    smokingStatuses: [],
};

const INITIAL_CLIENT_DATA = {
    currentWeight: null,
    targetWeight: null,
    goal: EMPTY_TEXT,
    complianceScore: null,
    height: null,
    medicalInfo: {
        chronicDiseases: EMPTY_TEXT,
        medications: EMPTY_TEXT,
        bloodType: EMPTY_TEXT,
        lastTestDate: EMPTY_TEXT,
    },
    lifestyle: {
        sleep: EMPTY_TEXT,
        activity: EMPTY_TEXT,
        smokingStatus: EMPTY_TEXT,
        alcoholStatus: EMPTY_TEXT,
    },
    dietDetails: {
        dietType: EMPTY_TEXT,
        intolerance: EMPTY_TEXT,
        dislikes: EMPTY_TEXT,
        waterTarget: EMPTY_TEXT,
    },
};

const INITIAL_FORM = {
    fullName: '',
    phone: '',
    currentWeight: '',
    targetWeight: '',
    heightCm: '',
};

const toText = (value) => (value === null || value === undefined ? '' : String(value));

const numberToText = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
};

const listToText = (items, emptyText = EMPTY_TEXT) => {
    const safeItems = normalizeMultiValue(items);
    return safeItems.length > 0 ? safeItems.join(', ') : emptyText;
};

const formatSleep = (min, max) => {
    const averageHours = getAverageSleepHours(min, max);
    return averageHours === null ? EMPTY_TEXT : `${formatDecimalValue(averageHours)} saat`;
};

const buildSleepInput = (profile) => {
    const averageHours = getAverageSleepHours(profile?.sleepHoursMin, profile?.sleepHoursMax);
    return averageHours === null ? '' : formatDecimalValue(averageHours);
};

const createFormFromProfile = (profile) => ({
    fullName: toText(profile?.fullName),
    phone: toText(profile?.phone),
    currentWeight: numberToText(profile?.currentWeight),
    targetWeight: numberToText(profile?.targetWeight),
    heightCm: numberToText(profile?.heightCm),
});

const mapProfileToClientData = (profile) => {
    if (!profile) return INITIAL_CLIENT_DATA;

    return {
        currentWeight: profile.currentWeight ?? null,
        targetWeight: profile.targetWeight ?? null,
        goal: profile.goalLabel || EMPTY_TEXT,
        complianceScore: profile.complianceScore ?? null,
        height: profile.heightCm ?? null,
        medicalInfo: {
            chronicDiseases: listToText(profile.chronicConditions),
            medications: listToText(profile.medications),
            bloodType: profile.bloodTypeLabel || EMPTY_TEXT,
            lastTestDate: profile.lastLabDate || EMPTY_TEXT,
        },
        lifestyle: {
            sleep: formatSleep(profile.sleepHoursMin, profile.sleepHoursMax),
            activity: profile.activityLevelLabel || EMPTY_TEXT,
            smokingStatus: profile.smokingStatusLabel || EMPTY_TEXT,
            alcoholStatus: profile.alcoholStatusLabel || EMPTY_TEXT,
        },
        dietDetails: {
            dietType: profile.nutritionTypeLabel || EMPTY_TEXT,
            intolerance: listToText(profile.foodIntolerances),
            dislikes: listToText(profile.dislikedFoods),
            waterTarget:
                profile.dailyWaterGoalMl === null || profile.dailyWaterGoalMl === undefined
                    ? EMPTY_TEXT
                    : `${formatDecimalValue(Number(profile.dailyWaterGoalMl) / 1000)} L`,
        },
    };
};

const normalizeListInput = (value) => normalizeMultiValue(value);

const normalizedNumberText = (value) => String(value || '').trim().replace(',', '.');

export const useProfileViewModel = () => {
    const [profile, setProfile] = useState(null);
    const [referenceData, setReferenceData] = useState(INITIAL_REFERENCE_DATA);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [pendingAvatarAsset, setPendingAvatarAsset] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [userName, setUserName] = useState(EMPTY_NAME);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [clientData, setClientData] = useState(INITIAL_CLIENT_DATA);

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [waterRemindersEnabled, setWaterRemindersEnabled] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [editingValue, setEditingValue] = useState('');
    const [editForm, setEditForm] = useState(INITIAL_FORM);
    const [isDietitianCardExpanded, setIsDietitianCardExpanded] = useState(false);
    const healthSaveLockRef = useRef(false);
    const avatarSelectionLockRef = useRef(false);
    const avatarUploadLockRef = useRef(false);
    const {
        activeDietitian,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        refreshConnectionStatus,
    } = useDietitianConnection();

    const applyProfile = useCallback((nextProfile) => {
        setProfile(nextProfile);
        setUserName(nextProfile?.fullName || EMPTY_NAME);
        setAvatarUrl(nextProfile?.avatarSignedUrl || null);
        setClientData(mapProfileToClientData(nextProfile));
        setEditForm(createFormFromProfile(nextProfile));
    }, []);

    const loadReferenceData = useCallback(async () => {
        const nextReferenceData = await getProfileReferenceData();
        setReferenceData(nextReferenceData);
        return nextReferenceData;
    }, []);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const nextProfile = await getCurrentUserProfile();
            applyProfile(nextProfile);
            return nextProfile;
        } catch (profileError) {
            const message = profileError?.message || 'Profil bilgileri yüklenemedi.';
            setError(message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [applyProfile]);

    useEffect(() => {
        loadReferenceData().catch((referenceError) => {
            setError(referenceError?.message || 'Referans veriler yüklenemedi.');
        });
    }, [loadReferenceData]);

    useFocusEffect(
        useCallback(() => {
            loadProfile();
            refreshConnectionStatus();
        }, [loadProfile, refreshConnectionStatus])
    );

    const expectedForm = useMemo(() => createFormFromProfile(profile), [profile]);
    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(editForm) !== JSON.stringify(expectedForm),
        [editForm, expectedForm],
    );
    const waterGoalLiters = useMemo(() => (
        profile?.dailyWaterGoalMl === null || profile?.dailyWaterGoalMl === undefined
            ? null
            : Number(profile.dailyWaterGoalMl) / 1000
    ), [profile?.dailyWaterGoalMl]);
    const sleepHours = useMemo(
        () => getAverageSleepHours(profile?.sleepHoursMin, profile?.sleepHoursMax),
        [profile?.sleepHoursMax, profile?.sleepHoursMin],
    );

    const startEditing = () => {
        setEditForm(createFormFromProfile(profile));
        setValidationErrors({});
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setEditForm(createFormFromProfile(profile));
        setValidationErrors({});
        setIsEditing(false);
    };

    const handleEditToggle = () => {
        if (isEditing) {
            cancelEditing();
        } else {
            startEditing();
        }
    };

    const updateField = (field, value) => {
        setEditForm((current) => ({ ...current, [field]: value }));
    };

    const addArrayItem = (field, value) => {
        const item = String(value || '').trim();
        if (!item) return;

        setEditingValue((current) => {
            const nextItems = normalizeListInput(current);
            if (!nextItems.some((existing) => existing.toLocaleLowerCase('tr-TR') === item.toLocaleLowerCase('tr-TR'))) {
                nextItems.push(item);
            }
            return nextItems.join(', ');
        });
    };

    const removeArrayItem = (_field, index) => {
        setEditingValue((current) => {
            const nextItems = normalizeListInput(current);
            nextItems.splice(index, 1);
            return nextItems.join(', ');
        });
    };

    const handleLogout = async () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await signOut();
                        } catch (logoutError) {
                            Alert.alert('Hata', logoutError.message);
                        } finally {
                            setIsLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleRowEdit = (fieldKey) => {
        setEditingField(fieldKey);
        setValidationErrors({});

        const fieldInitializers = {
            chronicConditions: () => (profile?.chronicConditions || []).join(', '),
            medications: () => (profile?.medications || []).join(', '),
            bloodTypeId: () => profile?.bloodTypeId ?? '',
            lastLabDate: () => profile?.lastLabDate || '',
            sleepHours: () => buildSleepInput(profile),
            activityLevelId: () => profile?.activityLevelId ?? '',
            smokingStatus: () => profile?.smokingStatus ?? '',
            alcoholStatusId: () => profile?.alcoholStatusId ?? '',
            nutritionTypeId: () => profile?.nutritionTypeId ?? '',
            goalId: () => profile?.goalId ?? '',
            foodIntolerances: () => (profile?.foodIntolerances || []).join(', '),
            dislikedFoods: () => (profile?.dislikedFoods || []).join(', '),
            dailyWaterGoalMl: () => numberToText(waterGoalLiters),
        };

        setEditingValue(fieldInitializers[fieldKey]?.() ?? '');
    };

    const handleRowSave = async () => {
        if (!editingField || isSaving) return;

        const updatesByField = {
            bloodTypeId: () => ({ bloodTypeId: editingValue }),
            lastLabDate: () => ({ lastLabDate: editingValue }),
            activityLevelId: () => ({ activityLevelId: editingValue }),
            smokingStatus: () => ({ smokingStatus: editingValue }),
            alcoholStatusId: () => ({ alcoholStatusId: editingValue }),
            nutritionTypeId: () => ({ nutritionTypeId: editingValue }),
            goalId: () => ({ goalId: editingValue }),
            dislikedFoods: () => ({ dislikedFoods: normalizeListInput(editingValue) }),
        };

        try {
            setIsSaving(true);
            setError(null);
            setValidationErrors({});
            const updates = updatesByField[editingField]?.() || {};
            const updatedProfile = await updateCurrentUserProfile(updates);
            applyProfile(updatedProfile);
            setEditingField(null);
            setEditingValue('');
            setSuccessMessage('Profiliniz güncellendi.');
        } catch (saveError) {
            const message = saveError?.message || 'Güncellenirken sorun oluştu.';
            setValidationErrors({ [editingField]: message });
            Alert.alert('Hata', message);
        } finally {
            setIsSaving(false);
        }
    };

    const saveHealthField = useCallback(async (fieldKey, updateFunction, value) => {
        if (healthSaveLockRef.current) throw new Error('Kaydetme işlemi devam ediyor.');

        try {
            healthSaveLockRef.current = true;
            setIsSaving(true);
            setError(null);
            setValidationErrors({});
            const updatedProfile = await updateFunction(value);
            applyProfile(updatedProfile);
            setSuccessMessage('Profiliniz güncellendi.');
            return updatedProfile;
        } catch (saveError) {
            const message = saveError?.message || 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.';
            setValidationErrors({ [fieldKey]: message });
            throw new Error(message);
        } finally {
            healthSaveLockRef.current = false;
            setIsSaving(false);
        }
    }, [applyProfile]);

    const saveChronicConditions = useCallback(
        (values) => saveHealthField('chronicConditions', updateChronicConditions, values),
        [saveHealthField],
    );

    const saveMedications = useCallback(
        (values) => saveHealthField('medications', updateMedications, values),
        [saveHealthField],
    );

    const saveFoodIntolerances = useCallback(
        (values) => saveHealthField('foodIntolerances', updateFoodIntolerances, values),
        [saveHealthField],
    );

    const saveWaterGoalLiters = useCallback(
        (liters) => saveHealthField('dailyWaterGoalMl', updateWaterGoal, liters),
        [saveHealthField],
    );

    const saveAverageSleepHours = useCallback(
        (hours) => saveHealthField('sleepHours', updateSleepHours, hours),
        [saveHealthField],
    );

    const saveProfile = async () => {
        if (isSaving) return;

        try {
            setIsSaving(true);
            setError(null);
            setValidationErrors({});

            const updates = {
                fullName: editForm.fullName,
                phone: editForm.phone,
                targetWeight: editForm.targetWeight,
                heightCm: editForm.heightCm,
            };

            const nextWeightText = normalizedNumberText(editForm.currentWeight);
            const currentWeightText = normalizedNumberText(profile?.currentWeight);
            if (nextWeightText && nextWeightText !== currentWeightText) {
                updates.currentWeight = editForm.currentWeight;
            }

            const updatedProfile = await updateCurrentUserProfile(updates);
            applyProfile(updatedProfile);
            setIsEditing(false);
            setSuccessMessage('Profiliniz güncellendi.');
            Alert.alert('Başarılı', 'Profiliniz güncellendi.');
        } catch (saveError) {
            const message = saveError?.message || 'Profil güncellenirken bir sorun oluştu.';
            setValidationErrors({ form: message });
            Alert.alert('Hata', message);
        } finally {
            setIsSaving(false);
        }
    };

    const selectAvatar = async () => {
        if (avatarSelectionLockRef.current || isUploadingAvatar) return;

        try {
            avatarSelectionLockRef.current = true;
            setIsSelectingAvatar(true);
            setError(null);

            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert('İzin Gerekli', 'Profil fotoğrafı seçmek için galeri izni vermelisiniz.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.85,
            });

            if (result.canceled || !result.assets?.[0]) return;
            setPendingAvatarAsset(result.assets[0]);
        } catch (selectionError) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.error('Profile avatar selection failed', selectionError);
            }
            Alert.alert('Hata', 'Profil fotoğrafı seçilemedi. Lütfen tekrar deneyin.');
        } finally {
            avatarSelectionLockRef.current = false;
            setIsSelectingAvatar(false);
        }
    };

    const cancelSelectedAvatar = () => {
        if (isUploadingAvatar) return;
        setPendingAvatarAsset(null);
    };

    const saveSelectedAvatar = async () => {
        if (!pendingAvatarAsset || avatarUploadLockRef.current) return;

        try {
            avatarUploadLockRef.current = true;
            setIsUploadingAvatar(true);
            setError(null);
            const updatedProfile = await uploadProfileAvatar(pendingAvatarAsset);
            applyProfile(updatedProfile);
            setPendingAvatarAsset(null);
            setSuccessMessage('Profil fotoğrafınız güncellendi.');
            Alert.alert('Başarılı', 'Profil fotoğrafınız kaydedildi.');
        } catch (uploadError) {
            Alert.alert(
                'Hata',
                uploadError?.message || 'Profil fotoğrafı kaydedilemedi. Lütfen tekrar deneyin.',
            );
        } finally {
            avatarUploadLockRef.current = false;
            setIsUploadingAvatar(false);
        }
    };

    const removeAvatar = async () => {
        if (isSelectingAvatar || isUploadingAvatar) return;
        try {
            setIsUploadingAvatar(true);
            const updatedProfile = await deleteProfileAvatar();
            applyProfile(updatedProfile);
        } catch (removeError) {
            Alert.alert('Hata', removeError?.message || 'Profil fotoğrafı silinemedi.');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const retry = async () => {
        await loadReferenceData();
        await loadProfile();
    };

    const handleDietitianCardToggle = () => {
        if (!hasActiveDietitian || !activeDietitian) return;
        setIsDietitianCardExpanded((current) => !current);
    };

    const displayedDietitian = activeDietitian || null;

    return {
        profile,
        form: editForm,
        referenceData,
        loading: isLoading,
        isLoading,
        isSaving,
        isSelectingAvatar,
        isUploadingAvatar,
        pendingAvatarUri: pendingAvatarAsset?.uri || null,
        error,
        successMessage,
        validationErrors,
        hasUnsavedChanges,
        userName,
        avatarUrl,
        clientData,
        emptyText: EMPTY_TEXT,
        emptyMeasurementText: EMPTY_MEASUREMENT,
        emptyDietitianText: EMPTY_DIETITIAN,
        notificationsEnabled,
        setNotificationsEnabled,
        waterRemindersEnabled,
        setWaterRemindersEnabled,
        handleLogout,
        isEditing,
        startEditing,
        cancelEditing,
        handleEditToggle,
        updateField,
        addArrayItem,
        removeArrayItem,
        editForm,
        setEditForm,
        handleSaveProfile: saveProfile,
        saveProfile,
        editingField,
        setEditingField,
        editingValue,
        setEditingValue,
        handleRowEdit,
        handleRowSave,
        waterGoalLiters,
        sleepHours,
        saveChronicConditions,
        saveMedications,
        saveFoodIntolerances,
        saveWaterGoalLiters,
        saveAverageSleepHours,
        handleAvatarUpload: selectAvatar,
        selectAvatar,
        cancelSelectedAvatar,
        saveSelectedAvatar,
        removeAvatar,
        retry,
        catalogs: {
            bloodTypes: referenceData.bloodTypes,
        },
        profileOptions: {
            activityLevel: referenceData.activityLevels,
            smokingStatus: referenceData.smokingStatuses,
            alcoholStatus: referenceData.alcoholStatuses,
            nutritionType: referenceData.nutritionTypes,
            clientGoals: referenceData.clientGoals,
        },
        activeDietitian: displayedDietitian,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        isDietitianCardExpanded,
        handleDietitianCardToggle,
        loadProfile,
        refreshProfile: loadProfile,
    };
};
