import { Text } from 'react-native';

export const fontFamilies = {
    light: 'Figtree_300Light',
    regular: 'Figtree_400Regular',
    medium: 'Figtree_500Medium',
    semiBold: 'Figtree_600SemiBold',
    bold: 'Figtree_700Bold',
};

export const applyTextDefaults = () => {
    if (!Text.defaultProps) {
        Text.defaultProps = {};
    }

    Text.defaultProps.style = {
        ...(Text.defaultProps.style || {}),
        fontFamily: fontFamilies.regular,
    };
};

applyTextDefaults();
