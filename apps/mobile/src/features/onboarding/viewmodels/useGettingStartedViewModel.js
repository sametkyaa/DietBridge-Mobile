import { Alert } from '../../../shared/utils/errorAlert';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AppState, Linking } from 'react-native';
import { getClientProfile } from '../../clients/services/clientService';
import { hasRecordedWater } from '../../clients/services/dailyLogService';
import { enablePushNotifications } from '../../push/services/pushLifecycleService';
import { getPushPermissionState } from '../../push/services/pushPermissions';
import { isProfileSetUp, readOnboardingState, updateOnboardingState } from '../services/onboardingStateStore';

const PERMISSION_GRANTED = 'permission_granted';
const UNSUPPORTED_RUNTIME = 'unsupported_runtime';

export function useGettingStartedViewModel({ userId, hasActiveDietitian, isLoadingConnection, water, isWaterConfirmed = false }) {
    const [dismissed, setDismissed] = useState(null);
    const [profileReady, setProfileReady] = useState(null);
    const [pushStatus, setPushStatus] = useState(null);
    const [isEnablingPush, setIsEnablingPush] = useState(false);
    const [firstWater, setFirstWater] = useState({ userId: null, done: null });
    const mountedRef = useRef(true);
    const currentUserIdRef = useRef(userId);
    currentUserIdRef.current = userId;
    const pushEnablePendingRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        let active = true;
        setDismissed(null);
        setFirstWater({ userId, done: null });
        readOnboardingState(userId)
            .then((state) => { if (active) setDismissed(state.checklistDismissed); })
            .catch(() => { if (active) setDismissed(false); });
        return () => { active = false; };
    }, [userId]);

    const refreshFirstWater = useCallback(async () => {
        if (!userId) return;
        try {
            const stored = await readOnboardingState(userId);
            const done = stored.firstWaterLogged === true || await hasRecordedWater(userId);
            if (!mountedRef.current || currentUserIdRef.current !== userId) return;
            setFirstWater((current) => current.userId === userId && current.done === true
                ? current : { userId, done });
            if (done && !stored.firstWaterLogged) {
                await updateOnboardingState(userId, { firstWaterLogged: true });
            }
        } catch {
            // Unknown history must not be presented as an unfinished first-water step.
            console.warn('First-water milestone could not be loaded.');
        }
    }, [userId]);

    useEffect(() => {
        void refreshFirstWater();
    }, [refreshFirstWater]);

    useEffect(() => {
        if (!userId || firstWater.userId !== userId || firstWater.done === true
            || !isWaterConfirmed || !Number.isFinite(Number(water)) || Number(water) <= 0) return;
        setFirstWater({ userId, done: true });
        updateOnboardingState(userId, { firstWaterLogged: true })
            .catch(() => console.warn('First-water milestone could not be stored.'));
    }, [firstWater, isWaterConfirmed, userId, water]);

    const refresh = useCallback(async () => {
        const [profileResult, pushResult] = await Promise.allSettled([getClientProfile(), getPushPermissionState()]);
        if (!mountedRef.current) return;
        if (profileResult.status === 'fulfilled') setProfileReady(isProfileSetUp(profileResult.value));
        setPushStatus(pushResult.status === 'fulfilled' ? pushResult.value?.status || null : UNSUPPORTED_RUNTIME);
        void refreshFirstWater();
    }, [refreshFirstWater]);

    useFocusEffect(useCallback(() => {
        if (dismissed === false) void refresh();
    }, [dismissed, refresh]));

    useEffect(() => {
        let previousState = AppState.currentState;
        const subscription = AppState.addEventListener('change', (nextState) => {
            const returnedToApp = previousState !== 'active' && nextState === 'active';
            previousState = nextState;
            if (returnedToApp && dismissed === false) void refresh();
        });
        return () => subscription.remove();
    }, [dismissed, refresh]);

    const enableNotifications = useCallback(async () => {
        if (pushEnablePendingRef.current) return;
        pushEnablePendingRef.current = true;
        setIsEnablingPush(true);
        try {
            const result = await enablePushNotifications();
            if (!mountedRef.current) return;
            if (result?.status === 'permission_denied') {
                Alert.alert('Bildirim izni kapalı', 'DietBridge bildirimlerini telefonunun uygulama ayarlarından açabilirsin.', [
                    { text: 'Vazgeç', style: 'cancel' },
                    {
                        text: 'Ayarları aç',
                        onPress: async () => {
                            if (!mountedRef.current) return;
                            try {
                                await Linking.openSettings();
                            } catch {
                                if (mountedRef.current) Alert.alert('Ayarlar açılamadı', 'Telefonunun Ayarlar bölümünden DietBridge uygulamasını seçip bildirimlere izin verebilirsin.');
                            }
                        },
                    },
                ]);
            } else if (result?.status === 'permission_not_determined') {
                Alert.alert('Bildirim izni verilmedi', 'Bildirimleri açmak için tekrar dokunup izin penceresinden onay verebilirsin.');
            } else if (result?.status !== 'registered') {
                Alert.alert('Bildirimler açılamadı', 'Bildirimler şu anda etkinleştirilemedi. Lütfen daha sonra tekrar dene.');
            }
        } catch {
            if (mountedRef.current) Alert.alert('Bildirimler açılamadı', 'Bildirimler şu anda etkinleştirilemedi. Lütfen daha sonra tekrar dene.');
        } finally {
            await refresh();
            pushEnablePendingRef.current = false;
            if (mountedRef.current) setIsEnablingPush(false);
        }
    }, [refresh]);

    const dismiss = useCallback(async () => {
        setDismissed(true);
        try {
            await updateOnboardingState(userId, { checklistDismissed: true });
        } catch (error) {
            console.warn('Checklist dismiss could not be stored:', error?.message || error);
        }
    }, [userId]);

    const items = useMemo(() => {
        const list = [
            { key: 'connect', label: 'Diyetisyenine bağlan', done: hasActiveDietitian === true },
            { key: 'profile', label: 'Profilini tamamla', done: profileReady === true },
            { key: 'water', label: 'İlk bardak suyunu ekle', hint: 'Su takibi kartından ekleyebilirsin', done: firstWater.userId === userId && firstWater.done === true },
        ];
        // Simulators and web cannot receive notifications, so the step is left out there.
        if (pushStatus !== UNSUPPORTED_RUNTIME) {
            list.push({ key: 'notifications', label: 'Bildirimleri aç', hint: 'Öğün ve randevu hatırlatmaları için', done: pushStatus === PERMISSION_GRANTED });
        }
        return list;
    }, [firstWater, hasActiveDietitian, profileReady, pushStatus, userId]);

    const completedCount = items.filter((item) => item.done).length;
    const isReady = dismissed === false && profileReady !== null && pushStatus !== null && !isLoadingConnection
        && firstWater.userId === userId && firstWater.done !== null;

    return {
        visible: isReady && completedCount < items.length,
        items,
        completedCount,
        totalCount: items.length,
        isEnablingPush,
        enableNotifications,
        dismiss,
    };
}
