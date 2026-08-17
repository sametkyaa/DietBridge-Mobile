import React, { useEffect, useRef } from 'react';
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
        controllerRef.current?.setSession(session);
    }, [session?.user?.id]);

    return null;
}
