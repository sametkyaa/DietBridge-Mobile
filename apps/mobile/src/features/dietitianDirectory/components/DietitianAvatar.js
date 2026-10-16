import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '../../../shared/theme';

const getInitials = (name) => String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toLocaleUpperCase('tr-TR'))
    .join('') || 'D';

export function DietitianAvatar({ name, avatarUrl, size = 52 }) {
    const [failed, setFailed] = useState(false);
    const frame = { width: size, height: size, borderRadius: size / 2 };
    if (avatarUrl && !failed) {
        return (
            <Image
                source={{ uri: avatarUrl }}
                style={[styles.avatar, frame]}
                onError={() => setFailed(true)}
                accessibilityLabel={`${name || 'Diyetisyen'} profil fotoğrafı`}
            />
        );
    }
    return (
        <View style={[styles.avatar, frame]} accessible={false} importantForAccessibility="no">
            <Text style={[styles.initials, size >= 72 && styles.initialsLarge]}>{getInitials(name)}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    avatar: { backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', borderRadius: radius.round },
    initials: { ...typography.bodyMedium, color: colors.tealDark },
    initialsLarge: { ...typography.sectionTitle, color: colors.tealDark },
});

export default DietitianAvatar;
