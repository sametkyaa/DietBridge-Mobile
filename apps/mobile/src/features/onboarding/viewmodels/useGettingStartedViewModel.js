import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, AppState, Linking } from 'react-native';
import { getClientProfile } from '../../clients/services/clientService';
import { enablePushNotifications } from '../../push/services/pushLifecycleService';
import { getPushPermissionState } from '../../push/services/pushPermissions';
import { isProfileSetUp, readOnboardingState, updateOnboardingState } from '../services/onboardingStateStore';

const PERMISSION_GRANTED = 'permission_granted';
const UNSUPPORTED_RUNTIME = 'unsupported_runtime';

export function useGettingStartedViewModel({ userId, hasActiveDietitian, isLoadingConnection, water }) {
    const [dismissed, setDismissed] = useState(null);
    const [profileReady, setProfileReady] = useState(null);
    const [pushStatus, setPushStatus] = useState(null);
    const [isEnablingPush, setIsEnablingPush] = useState(false);
    const mountedRef = useRef(true);
    const pushEnablePendingRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        let active = true;
        readOnboardingState(userId)
            .then((state) => { if (active) setDismissed(state.checklistDismissed); })
            .catch(() => { if (active) setDismissed(false); });
        return () => { active = false; };
    }, [userId]);

    const refresh = useCallback(async () => {
        const [profileResult, pushResult] = await Promise.allSettled([getClientProfile(), getPushPermissionState()]);
        if (!mountedRef.current) return;
        if (profileResult.status === 'fulfilled') setProfileReady(isProfileSetUp(profileResult.value));
        setPushStatus(pushResult.status === 'fulfilled' ? pushResult.value?.status || null : UNSUPPORTED_RUNTIME);
    }, []);

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
            { key: 'water', label: 'İlk bardak suyunu ekle', hint: 'Su takibi kartından ekleyebilirsin', done: Number(water) > 0 },
        ];
        // Simulators and web cannot receive notifications, so the step is left out there.
        if (pushStatus !== UNSUPPORTED_RUNTIME) {
            list.push({ key: 'notifications', label: 'Bildirimleri aç', hint: 'Öğün ve randevu hatırlatmaları için', done: pushStatus === PERMISSION_GRANTED });
        }
        return list;
    }, [hasActiveDietitian, profileReady, pushStatus, water]);

    const completedCount = items.filter((item) => item.done).length;
    const isReady = dismissed === false && profileReady !== null && pushStatus !== null && !isLoadingConnection;

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
