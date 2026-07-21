import { Platform, StatusBar, StyleSheet } from 'react-native';
import { fontFamilies } from './fonts';

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
const topBarPadding = Math.max(statusBarHeight - 8, 0);

export const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F5F7',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingTop: topBarPadding,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#D8DCE2',
    },
    greeting: {
        flex: 1,
        marginLeft: 12,
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2A37',
        fontFamily: fontFamilies.medium,
    },
    bell: {
        fontSize: 22,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
    },
    calorieCard: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    calorieMetric: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    calorieContext: {
        marginTop: 6,
        fontSize: 14,
        color: '#6B7280',
        fontFamily: fontFamilies.medium,
    },
    calorieValue: {
        fontSize: 48,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2A37',
        fontFamily: fontFamilies.bold,
    },
    calorieUnit: {
        fontSize: 18,
        textAlign: 'center',
        color: '#4CAF50',
        marginBottom: 4,
        fontFamily: fontFamilies.medium,
    },
    stepText: {
        textAlign: 'left',
        color: '#6B7280',
        fontFamily: fontFamilies.regular,
    },
    stepRow: {
        marginTop: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepIcon: {
        marginRight: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A37',
        marginBottom: 12,
        fontFamily: fontFamilies.medium,
    },
    macroBlock: {
        marginBottom: 12,
    },
    macroLabel: {
        fontSize: 14,
        color: '#1F2A37',
        marginBottom: 6,
        fontFamily: fontFamilies.regular,
    },
    progressBackground: {
        height: 10,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    waterProgressFill: {
        height: '100%',
        backgroundColor: '#90AEFF',
    },
    waterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    waterIcon: {
        fontSize: 20,
    },
    waterCupButton: {
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    waterCupIcon: {
        fontSize: 28,
    },
    waterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    waterAmount: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2A37',
        marginBottom: 6,
        fontFamily: fontFamilies.medium,
    },
    nextMeal: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealIconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    mealEmoji: {
        fontSize: 22,
    },
    mealTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2A37',
        fontFamily: fontFamilies.medium,
    },
    mealDesc: {
        fontSize: 14,
        color: '#4B5563',
        marginTop: 2,
        fontFamily: fontFamilies.regular,
    },
    mealTimeText: {
        marginTop: 4,
        color: '#9CA3AF',
        fontFamily: fontFamilies.regular,
    },
    nextMealActions: {
        marginTop: 16,
    },
    eatButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    eatButtonDisabled: {
        backgroundColor: '#A5D6A7',
    },
    eatButtonCompleted: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    eatButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontFamily: fontFamilies.medium,
    },
    eatButtonTextCompleted: {
        color: '#1F2A37',
    },
    waterAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    nextMealLink: {
        marginTop: 12,
        alignItems: 'center',
    },
    nextMealLinkText: {
        color: '#0EA5E9',
        fontFamily: fontFamilies.medium,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F5F7',
    },
    placeholderText: {
        fontSize: 18,
        color: '#6B7280',
        fontFamily: fontFamilies.regular,
    },
});

export default styles;
