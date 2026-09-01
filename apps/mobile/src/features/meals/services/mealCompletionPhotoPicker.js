import * as ImagePicker from 'expo-image-picker';

const SOURCE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const EXTENSION_MIME = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

const createPickerError = (code, cause) => {
    const error = new Error('Meal completion photo picker failed.');
    error.code = code;
    if (cause) error.cause = cause;
    return error;
};

const resolveSourceMimeType = (asset) => {
    const declared = typeof asset?.mimeType === 'string' ? asset.mimeType.toLowerCase() : null;
    if (declared) return SOURCE_MIME_TYPES.has(declared) ? declared : null;

    const fileName = typeof asset?.fileName === 'string' ? asset.fileName : asset?.uri;
    const match = typeof fileName === 'string'
        ? fileName.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/)
        : null;
    const extension = match?.[1];
    return extension ? EXTENSION_MIME[extension] || null : null;
};

const launchPicker = async (source) => {
    if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission?.granted) throw createPickerError('permission_denied');
        return ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
            allowsEditing: true,
            quality: 1,
            exif: false,
        });
    }

    if (source === 'gallery') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission?.granted) throw createPickerError('permission_denied');
        return ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
            allowsMultipleSelection: false,
            allowsEditing: true,
            quality: 1,
            exif: false,
        });
    }

    return null;
};

export const pickMealCompletionPhoto = async (source) => {
    let result;
    try {
        result = await launchPicker(source);
    } catch (error) {
        if (error?.code === 'permission_denied') throw error;
        throw createPickerError('picker_failed', error);
    }

    if (!result || result.canceled) return null;
    const asset = Array.isArray(result.assets) ? result.assets[0] : null;
    if (!asset || typeof asset.uri !== 'string' || !asset.uri) {
        throw createPickerError('invalid_asset');
    }

    const mimeType = resolveSourceMimeType(asset);
    if (!mimeType) throw createPickerError('unsupported_type');

    return {
        uri: asset.uri,
        mimeType,
        width: Number.isFinite(asset.width) ? asset.width : null,
        height: Number.isFinite(asset.height) ? asset.height : null,
        fileName: typeof asset.fileName === 'string' ? asset.fileName : null,
        byteSize: Number.isFinite(asset.fileSize) ? asset.fileSize : null,
    };
};

export default pickMealCompletionPhoto;
