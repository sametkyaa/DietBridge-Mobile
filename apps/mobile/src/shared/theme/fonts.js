import { Text } from 'react-native';

export const fontFamilies = {
    light: 'Inter_300Light',
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
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
