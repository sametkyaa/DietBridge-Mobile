import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getClientProfile,
    getProfileReferenceData,
    saveCurrentWeight,
    updateCurrentUserProfile,
} from '../../clients/services/clientService';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { updateOnboardingState } from '../services/onboardingStateStore';

export const ONBOARDING_STEPS = Object.freeze({
    CONNECT: 'connect',
    GOAL: 'goal',
    BODY: 'body',
    PREFERENCES: 'preferences',
});

const SAVE_FAILED_MESSAGE = 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.';

const toInputValue = (value) => (value === null || value === undefined ? '' : String(value).replace('.', ','));
const toNumber = (value) => {
    const parsed = Number(String(value || '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
};

export function useOnboardingSetupViewModel({ userId, mode = 'initial', onExit }) {
    const { hasActiveDietitian, isLoadingConnection } = useDietitianConnection();
    // The step list is fixed on open so a connection made mid-flow does not shift the steps.
    const [steps] = useState(() => {
        const includeConnect = mode === 'initial' && (!hasActiveDietitian || isLoadingConnection);
        return [
            ...(includeConnect ? [ONBOARDING_STEPS.CONNECT] : []),
            ONBOARDING_STEPS.GOAL,
            ONBOARDING_STEPS.BODY,
            ONBOARDING_STEPS.PREFERENCES,
        ];
    });
    const [stepIndex, setStepIndex] = useState(0);
    const [referenceData, setReferenceData] = useState({ clientGoals: [], activityLevels: [], nutritionTypes: [] });
    const [loadStatus, setLoadStatus] = useState('loading');
    const [form, setForm] = useState({
        goalId: null,
        heightCm: '',
        currentWeight: '',
        targetWeight: '',
        nutritionTypeId: null,
        activityLevelId: null,
        foodIntolerances: [],
    });
    const [userName, setUserName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const initialWeightRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const load = useCallback(async () => {
        setLoadStatus('loading');
        try {
            const [references, profile] = await Promise.all([getProfileReferenceData(), getClientProfile()]);
            if (!mountedRef.current) return;
            setReferenceData({
                clientGoals: references.clientGoals || [],
                activityLevels: references.activityLevels || [],
                nutritionTypes: references.nutritionTypes || [],
            });
            initialWeightRef.current = profile?.currentWeight ?? null;
            setUserName(String(profile?.fullName || '').trim().split(/\s+/)[0] || '');
            setForm({
                goalId: profile?.goalId ?? null,
                heightCm: toInputValue(profile?.heightCm),
                currentWeight: toInputValue(profile?.currentWeight),
                targetWeight: toInputValue(profile?.targetWeight),
                nutritionTypeId: profile?.nutritionTypeId ?? null,
                activityLevelId: profile?.activityLevelId ?? null,
                foodIntolerances: profile?.foodIntolerances || [],
            });
            setLoadStatus('success');
        } catch (loadError) {
            console.warn('Onboarding data load failed:', loadError?.message || loadError);
            if (mountedRef.current) setLoadStatus('error');
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const setField = useCallback((field, value) => {
        setError(null);
        setForm((current) => ({ ...current, [field]: value }));
    }, []);

    const toggleIntolerance = useCallback((value) => {
        setError(null);
        setForm((current) => {
            const exists = current.foodIntolerances.some((item) => item.toLocaleLowerCase('tr-TR') === value.toLocaleLowerCase('tr-TR'));
            return {
                ...current,
                foodIntolerances: exists
                    ? current.foodIntolerances.filter((item) => item.toLocaleLowerCase('tr-TR') !== value.toLocaleLowerCase('tr-TR'))
                    : [...current.foodIntolerances, value],
            };
        });
    }, []);

    const step = steps[stepIndex];
    const isLastStep = stepIndex === steps.length - 1;

    const weightDifference = useMemo(() => {
        const current = toNumber(form.currentWeight);
        const target = toNumber(form.targetWeight);
        if (current === null || target === null || current === target) return null;
        return Math.round((current - target) * 10) / 10;
    }, [form.currentWeight, form.targetWeight]);

    const complete = useCallback(async () => {
        try {
            await updateOnboardingState(userId, { setupCompleted: true });
        } catch (storeError) {
            // The flag only stops the flow from reopening; losing it is not worth blocking the user.
            console.warn('Onboarding state could not be stored:', storeError?.message || storeError);
        }
        onExit?.();
    }, [onExit, userId]);

    const goForward = useCallback(async () => {
        if (isLastStep) {
            await complete();
            return;
        }
        setError(null);
        setStepIndex((index) => Math.min(index + 1, steps.length - 1));
    }, [complete, isLastStep, steps.length]);

    const saveStep = async () => {
        if (step === ONBOARDING_STEPS.GOAL && form.goalId !== null) {
            await updateCurrentUserProfile({ goalId: form.goalId });
        }
        if (step === ONBOARDING_STEPS.BODY) {
            const updates = {};
            if (form.heightCm.trim()) updates.heightCm = form.heightCm;
            if (form.targetWeight.trim()) updates.targetWeight = form.targetWeight;
            if (Object.keys(updates).length > 0) await updateCurrentUserProfile(updates);
            const weight = toNumber(form.currentWeight);
            // Only a changed value is written, so reopening the flow does not add duplicate weigh-ins.
            if (form.currentWeight.trim() && weight !== initialWeightRef.current) {
                await saveCurrentWeight(form.currentWeight);
                initialWeightRef.current = weight;
            }
        }
        if (step === ONBOARDING_STEPS.PREFERENCES) {
            await updateCurrentUserProfile({
                nutritionTypeId: form.nutritionTypeId,
                activityLevelId: form.activityLevelId,
                foodIntolerances: form.foodIntolerances,
            });
        }
    };

    const next = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError(null);
        try {
            await saveStep();
            if (!mountedRef.current) return;
            await goForward();
        } catch (saveError) {
            if (mountedRef.current) setError(saveError?.message || SAVE_FAILED_MESSAGE);
        } finally {
            if (mountedRef.current) setIsSaving(false);
        }
    };

    const back = useCallback(() => {
        if (isSaving) return true;
        if (stepIndex === 0) return false;
        setError(null);
        setStepIndex((index) => Math.max(index - 1, 0));
        return true;
    }, [isSaving, stepIndex]);

    return {
        steps,
        step,
        stepIndex,
        isLastStep,
        loadStatus,
        retryLoad: load,
        referenceData,
        form,
        setField,
        toggleIntolerance,
        weightDifference,
        userName,
        isSaving,
        error,
        next,
        skip: () => { if (!isSaving) void goForward(); },
        back,
        finishLater: () => { if (!isSaving) void complete(); },
    };
}
