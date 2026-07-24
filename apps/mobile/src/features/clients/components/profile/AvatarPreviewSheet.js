import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { AppButton, BottomSheetView } from '../../../../shared/components/ui';
import { radius, spacing } from '../../../../shared/theme';

export function AvatarPreviewSheet({ uri, onSave, onClose, isUploading, bottomInset }) {
    return (
        <BottomSheetView visible={!!uri} onClose={isUploading ? () => {} : onClose} title="Profil fotoğrafı önizlemesi" bottomInset={bottomInset} footer={(
            <>
                <AppButton label="Fotoğrafı kaydet" onPress={onSave} loading={isUploading} disabled={isUploading} />
                <AppButton variant="text" label="İptal" onPress={onClose} disabled={isUploading} style={styles.cancel} />
            </>
        )}>
            {uri ? <Image source={{ uri }} style={styles.image} accessibilityLabel="Seçilen profil fotoğrafı önizlemesi" /> : null}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({ image: { width: '100%', aspectRatio: 1, maxHeight: 320, borderRadius: radius.card }, cancel: { alignSelf: 'center', marginTop: spacing.x1 } });
export default AvatarPreviewSheet;
