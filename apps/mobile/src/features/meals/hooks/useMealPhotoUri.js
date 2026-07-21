import { useCallback, useEffect, useRef, useState } from 'react';
import {
    createMealPhotoImageRetryGate,
    createMealPhotoRequestGate,
    isCanonicalMealPhotoPath,
    MealPhotoResolveStatus,
    refreshMealPhotoUri,
    resolveMealPhotoUri,
} from '../services/mealPhotoResolver';

const placeholderState = (photoPath) => ({
    photoPath,
    photoUri: null,
    status: MealPhotoResolveStatus.PLACEHOLDER,
});

export const useMealPhotoUri = (photoPath) => {
    const [state, setState] = useState(() => placeholderState(photoPath));
    const isMountedRef = useRef(true);
    const requestGateRef = useRef(createMealPhotoRequestGate());
    const pathRef = useRef(photoPath);
    const imageRetryGateRef = useRef(createMealPhotoImageRetryGate());

    pathRef.current = photoPath;

    const load = useCallback((forceRefresh = false) => {
        const requestedPath = photoPath;
        const request = requestGateRef.current.begin(requestedPath);

        if (!isCanonicalMealPhotoPath(requestedPath)) {
            if (isMountedRef.current) setState(placeholderState(requestedPath));
            return Promise.resolve(placeholderState(requestedPath));
        }

        if (isMountedRef.current) {
            setState(placeholderState(requestedPath));
        }

        const resolverRequest = forceRefresh
            ? refreshMealPhotoUri(requestedPath)
            : resolveMealPhotoUri(requestedPath);

        return resolverRequest.then((result) => {
            if (!isMountedRef.current
                || !requestGateRef.current.isCurrent(request)
                || pathRef.current !== requestedPath) return result;

            setState({ photoPath: requestedPath, ...result });
            return result;
        });
    }, [photoPath]);

    useEffect(() => {
        isMountedRef.current = true;
        load();
        return () => {
            isMountedRef.current = false;
            requestGateRef.current.invalidate();
        };
    }, [load]);

    const retryAfterImageError = useCallback(() => {
        if (!imageRetryGateRef.current.canRetry(photoPath)) return;
        load(true);
    }, [load, photoPath]);

    return {
        photoUri: state.photoPath === photoPath ? state.photoUri : null,
        photoStatus: state.photoPath === photoPath ? state.status : MealPhotoResolveStatus.PLACEHOLDER,
        retryAfterImageError,
    };
};
