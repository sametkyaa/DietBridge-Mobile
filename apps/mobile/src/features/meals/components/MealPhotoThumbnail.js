import React, { useEffect, useState } from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { useMealPhotoUri } from '../hooks/useMealPhotoUri';
import {
    isCanonicalMealCompletionPhotoPath,
    MealPhotoResolveStatus,
} from '../services/mealPhotoResolver';

export const MealPhotoThumbnail = ({
    photoPath,
    completionPhotoPath,
    localCompletionPhotoUri,
    imageStyle,
    wrapperStyle,
    onPress,
    accessibilityLabel,
    fallback,
}) => {
    const { photoUri, retryAfterImageError } = useMealPhotoUri(photoPath);
    const {
        photoUri: resolvedCompletionPhotoUri,
        photoStatus: completionPhotoStatus,
        retryAfterImageError: retryCompletionPhotoAfterImageError,
    } = useMealPhotoUri(completionPhotoPath);
    const hasValidCompletionPhotoPath = isCanonicalMealCompletionPhotoPath(completionPhotoPath);
    const activeUri = localCompletionPhotoUri
        || resolvedCompletionPhotoUri
        || (hasValidCompletionPhotoPath && completionPhotoStatus !== MealPhotoResolveStatus.ERROR ? null : photoUri);
    const activeSource = localCompletionPhotoUri
        ? 'local'
        : resolvedCompletionPhotoUri
            ? 'completion'
            : 'meal';
    const [failedUri, setFailedUri] = useState(null);

    useEffect(() => {
        setFailedUri(null);
    }, [activeUri]);

    if (!activeUri || failedUri === activeUri) return fallback || null;

    const image = (
        <Image
            source={{ uri: activeUri }}
            style={imageStyle}
            resizeMode="cover"
            onError={() => {
                setFailedUri(activeUri);
                if (activeSource === 'completion') retryCompletionPhotoAfterImageError();
                if (activeSource === 'meal') retryAfterImageError();
            }}
            accessible={false}
        />
    );

    if (!onPress) return image;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(activeUri)}
            style={wrapperStyle}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || 'Öğün fotoğrafını aç'}
        >
            {image}
        </TouchableOpacity>
    );
};
