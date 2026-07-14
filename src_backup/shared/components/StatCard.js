import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatCard = ({ title, value, highlight = false }) => (
    <View style={styles.statCard}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, highlight && styles.textPrimary]}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statTitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    textPrimary: {
        color: '#4CAF50',
    },
});

export default StatCard;
