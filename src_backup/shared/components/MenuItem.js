import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MenuItem = ({
    icon,
    title,
    value,
    isDestructive = false,
    hasToggle = false,
    isToggled = false,
    onToggle,
    onPress,
    valueStyle,
    isBadge = false
}) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        disabled={hasToggle}
        activeOpacity={0.7}
    >
        <View style={styles.menuLeft}>
            <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                <Ionicons name={icon} size={22} color={isDestructive ? '#EF4444' : '#4B5563'} />
            </View>
            <Text style={[styles.menuTitle, isDestructive && styles.textDestructive]}>{title}</Text>
        </View>

        <View style={styles.menuRight}>
            {hasToggle ? (
                <Switch
                    trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                    thumbColor={isToggled ? '#4CAF50' : '#f4f3f4'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={onToggle}
                    value={isToggled}
                />
            ) : (
                <>
                    {value ? (
                        <View style={isBadge && styles.badge}>
                            <Text style={[
                                styles.menuValue,
                                value === 'Yer Fıstığı' && styles.textWarning,
                                valueStyle,
                                isBadge && styles.badgeText
                            ]}>
                                {value}
                            </Text>
                        </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </>
            )}
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconBoxDestructive: {
        backgroundColor: '#FEE2E2',
    },
    menuTitle: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuValue: {
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8,
    },
    textWarning: {
        color: '#EF4444',
        fontWeight: '500',
    },
    textDestructive: {
        color: '#EF4444',
    },
    badge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#166534',
        fontWeight: '600',
        fontSize: 12,
    },
});

export default MenuItem;
