import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const NutritionSummaryCard = ({
    caloriesConsumed,
    caloriesTarget,
    steps,
    macros,
}) => {
    // Circular Progress Calculation
    const radius = 50;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(caloriesConsumed / caloriesTarget, 1);
    const strokeDashoffset = circumference - progress * circumference;

    // Macro Progress Bar Component
    const MacroRow = ({ label, value, target, unit, color }) => {
        const macroProgress = Math.min(value / target, 1);
        return (
            <View style={styles.macroRow}>
                <View style={styles.macroHeader}>
                    <Text style={styles.macroLabel}>{label}</Text>
                    <Text style={styles.macroValue}>
                        {value}/{target} {unit}
                    </Text>
                </View>
                <View style={styles.macroTrack}>
                    <View
                        style={[
                            styles.macroFill,
                            { width: `${macroProgress * 100}%`, backgroundColor: color },
                        ]}
                    />
                </View>
            </View>
        );
    };

    return (
        <View style={styles.card}>
            {/* Left Side: Calories & Steps */}
            <View style={styles.leftSection}>
                <View style={styles.circleContainer}>
                    <Svg height="120" width="120" viewBox="0 0 120 120">
                        <Circle
                            cx="60"
                            cy="60"
                            r={radius}
                            stroke="#E5E7EB"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        <Circle
                            cx="60"
                            cy="60"
                            r={radius}
                            stroke="#509F42"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin="60, 60"
                        />
                    </Svg>
                    <View style={styles.circleTextContainer}>
                        <Text style={styles.caloriesText}>{caloriesConsumed}</Text>
                        <Text style={styles.kcalText}>kcal</Text>
                    </View>
                </View>

                <View style={styles.stepsContainer}>
                    <Ionicons name="footsteps" size={16} color="#9CA3AF" />
                    <Text style={styles.stepsText}>{steps} adım</Text>
                </View>
            </View>

            {/* Right Side: Macros */}
            <View style={styles.rightSection}>
                <Text style={styles.macrosTitle}>Makrolar</Text>
                <MacroRow
                    label="Karbonhidrat"
                    value={macros.carbs.value}
                    target={macros.carbs.target}
                    unit={macros.carbs.unit}
                    color="#3B82F6" // Blue
                />
                <MacroRow
                    label="Protein"
                    value={macros.protein.value}
                    target={macros.protein.target}
                    unit={macros.protein.unit}
                    color="#509F42" // Green
                />
                <MacroRow
                    label="Yağ"
                    value={macros.fat.value}
                    target={macros.fat.target}
                    unit={macros.fat.unit}
                    color="#F59E0B" // Yellow/Orange
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        marginVertical: 10,
    },
    leftSection: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '40%',
    },
    circleContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    circleTextContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    caloriesText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    kcalText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    consumedText: {
        fontSize: 8,
        color: '#9CA3AF',
        marginTop: 2,
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    stepsText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    rightSection: {
        flex: 1,
        paddingLeft: 16,
    },
    macrosTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    macroRow: {
        marginBottom: 10,
    },
    macroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    macroLabel: {
        fontSize: 12,
        color: '#4B5563',
        fontWeight: '500',
    },
    macroValue: {
        fontSize: 12,
        color: '#6B7280',
    },
    macroTrack: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        width: '100%',
        overflow: 'hidden',
    },
    macroFill: {
        height: '100%',
        borderRadius: 3,
    },
});

export default NutritionSummaryCard;
