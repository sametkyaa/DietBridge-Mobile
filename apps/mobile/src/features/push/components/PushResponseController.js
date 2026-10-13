import { useEffect } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { fetchNotificationById } from '../../notifications/services/notificationService';
import { createPushResponseController } from '../utils/pushResponseController.cjs';

export default function PushResponseController({ userId, navigationRef, enabled }) {
    useEffect(() => {
        if (!enabled || !userId) return undefined;
        const controller = createPushResponseController({
            userId,
            fetchNotification: fetchNotificationById,
            isReady: () => navigationRef.current?.isReady() === true,
            openCenter: () => navigationRef.current?.navigate('NotificationCenter'),
            clearResponse: () => Notifications.clearLastNotificationResponseAsync(),
            onError: () => Alert.alert('Bildirim', 'Bildirim açılamadı. Bildirimler ekranından tekrar deneyebilirsiniz.'),
        });
        const listener = Notifications.addNotificationResponseReceivedListener(controller.receive);
        const unsubscribe = navigationRef.current?.addListener('state', controller.flush);
        Notifications.getLastNotificationResponseAsync().then(controller.receive).catch(() => {
            console.warn('Push response restoration unavailable');
        });
        return () => { controller.dispose(); listener.remove(); unsubscribe?.(); };
    }, [userId, navigationRef, enabled]);
    return null;
}
