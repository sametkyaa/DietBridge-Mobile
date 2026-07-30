import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { createChatImageError } from '../utils/chatImageError';
import {
    CHAT_IMAGE_MIME_TYPE,
    CHAT_IMAGE_SOURCE_MIME_TYPES,
} from '../constants/chatImageConstants';

// Expo-backed image selection + canonicalization adapters.
//
// This is the only module that imports the native Expo image packages. The
// pure canonicalizer (`canonicalizeChatImage`) and the Supabase image service
// consume the plain descriptors produced here, so their logic is testable in
// Node without a device. Nothing here talks to Supabase.

// Infers a supported source MIME type from the picker asset. Expo exposes
// `mimeType` on newer SDKs; otherwise the file extension is mapped. Unknown
// types resolve to null so the fail-closed guard rejects them.
const EXTENSION_MIME = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
};

const resolveSourceMimeType = (asset) => {
    const declared = typeof asset?.mimeType === 'string' ? asset.mimeType.toLowerCase() : null;
    if (declared && CHAT_IMAGE_SOURCE_MIME_TYPES.includes(declared)) return declared;

    const fileName = typeof asset?.fileName === 'string' ? asset.fileName : asset?.uri;
    const match = typeof fileName === 'string' ? fileName.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/) : null;
    const extension = match ? match[1] : null;
    return extension && EXTENSION_MIME[extension] ? EXTENSION_MIME[extension] : null;
};

// Requests library permission and opens the system picker for a single image.
// Returns a normalized source descriptor, or null when the user cancels.
// Throws a ChatImageError for permission denial or an unusable asset.
export const pickChatImage = async () => {
    let permission;
    try {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    } catch (error) {
        throw createChatImageError('permission_denied', { cause: error });
    }
    if (!permission?.granted) {
        throw createChatImageError('permission_denied');
    }

    let result;
    try {
        result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? 'images',
            allowsMultipleSelection: false,
            allowsEditing: false,
            quality: 1,
            exif: false,
        });
    } catch (error) {
        throw createChatImageError('decode_failed', { cause: error });
    }

    if (result?.canceled) return null;
    const asset = Array.isArray(result?.assets) ? result.assets[0] : null;
    if (!asset || typeof asset.uri !== 'string' || !asset.uri) {
        throw createChatImageError('decode_failed');
    }

    const mimeType = resolveSourceMimeType(asset);
    if (!mimeType) throw createChatImageError('unsupported_type');

    return {
        uri: asset.uri,
        mimeType,
        width: Number.isFinite(asset.width) ? asset.width : null,
        height: Number.isFinite(asset.height) ? asset.height : null,
        fileName: typeof asset.fileName === 'string' ? asset.fileName : null,
        byteSize: Number.isFinite(asset.fileSize) ? asset.fileSize : null,
    };
};

// Reads the byte length of a local file. Falls back to null when the size
// cannot be determined (the canonicalizer then relies on the read body length).
const getFileByteSize = (file) => {
    try {
        return file.exists && Number.isFinite(file.size) ? file.size : null;
    } catch {
        return null;
    }
};

// Reads a local JPEG into an ArrayBuffer suitable for a single Storage upload.
// Supabase-js accepts an ArrayBuffer body with an explicit contentType.
const readFileAsArrayBuffer = async (file) => {
    const bytes = await file.bytes();
    // Copy into a standalone ArrayBuffer so the upload body is independent of
    // the native-backed view's lifetime.
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

// Assembles the injected dependencies consumed by `canonicalizeChatImage`.
// `encode` re-encodes the picked source to a JPEG at the requested quality,
// resizing to the planned dimensions, and returns the temp URI plus its byte
// size and an upload-ready ArrayBuffer body.
export const createExpoCanonicalizerDeps = () => ({
    measure: async (source) => {
        // The picker already reports intrinsic dimensions; a zero-op manipulate
        // confirms them and applies orientation metadata for the encode step.
        if (Number.isFinite(source.width) && Number.isFinite(source.height)) {
            return { width: source.width, height: source.height };
        }
        const measured = await ImageManipulator.manipulateAsync(source.uri, [], {
            compress: 1,
            format: ImageManipulator.SaveFormat.JPEG,
        });
        return { width: measured.width, height: measured.height };
    },
    encode: async (source, { target, quality, resizeRequired }) => {
        const actions = resizeRequired
            ? [{ resize: { width: target.width, height: target.height } }]
            : [];
        const output = await ImageManipulator.manipulateAsync(source.uri, actions, {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
        });
        const outputFile = new File(output.uri);
        const body = await readFileAsArrayBuffer(outputFile);
        const byteSize = getFileByteSize(outputFile);
        return {
            uri: output.uri,
            width: output.width,
            height: output.height,
            byteSize: byteSize ?? (body ? body.byteLength : null),
            body,
            mimeType: CHAT_IMAGE_MIME_TYPE,
        };
    },
    cleanup: async (uri) => {
        if (!uri) return;
        try {
            const file = new File(uri);
            if (file.exists) file.delete();
        } catch {
            // Best-effort: temp files also expire with the OS cache.
        }
    },
});

export default { pickChatImage, createExpoCanonicalizerDeps };
