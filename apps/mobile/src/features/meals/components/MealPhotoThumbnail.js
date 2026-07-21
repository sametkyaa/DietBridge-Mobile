import React from 'react';
import { Image, TouchableOpacity } from 'react-native';
import { useMealPhotoUri } from '../hooks/useMealPhotoUri';

export const MealPhotoThumbnail = ({
    photoPath,
    completionPhotoUri,
    imageStyle,
    wrapperStyle,
    onPress,
    fallback,
}) => {
    const { photoUri, retryAfterImageError } = useMealPhotoUri(photoPath);
    const activeUri = completionPhotoUri || photoUri;

    if (!activeUri) return fallback || null;

    const image = (
        <Image
            source={{ uri: activeUri }}
            style={imageStyle}
            onError={completionPhotoUri ? undefined : retryAfterImageError}
        />
    );

    if (!onPress) return image;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(activeUri)}
            style={wrapperStyle}
        >
            {image}
        </TouchableOpacity>
    );
};
