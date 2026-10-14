import React, { useEffect, useRef } from 'react';
import { setForegroundPushUser } from '../services/pushPresentationService';
import {
    createPushLifecycleController,
    setActivePushLifecycleController,
} from '../services/pushLifecycleService';

export default function PushLifecycleController({ session = null }) {
    const controllerRef = useRef(null);

    if (!controllerRef.current) {
        controllerRef.current = createPushLifecycleController();
    }

    useEffect(() => {
        const controller = controllerRef.current;
        const clearActiveController = setActivePushLifecycleController(controller);
        return () => {
            clearActiveController();
            controller.dispose();
        };
    }, []);

    useEffect(() => {
        setForegroundPushUser(session?.user?.id || null);
        controllerRef.current?.setSession(session);
        return () => setForegroundPushUser(null);
    }, [session?.user?.id]);

    return null;
}
