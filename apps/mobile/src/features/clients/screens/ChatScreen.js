import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../../shared/theme/styles';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { CONNECTION_REQUIRED_MESSAGE } from '../../dietitianConnection/services/dietitianConnectionService';

const ChatScreen = () => {
    const insets = useSafeAreaInsets();
    const screenBottomPadding = 64 + insets.bottom + insets.bottom + 16;
    const {
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
    } = useDietitianConnection();

    if (isLoadingConnection) {
        return (
            <SafeAreaView style={[styles.centered, { paddingBottom: screenBottomPadding }]}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </SafeAreaView>
        );
    }

    if (!hasActiveDietitian) {
        return (
            <SafeAreaView style={[styles.centered, { paddingBottom: screenBottomPadding }]}>
                <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
                    <Ionicons name="lock-closed-outline" size={30} color="#6B7280" />
                    <Text style={[styles.placeholderText, { textAlign: 'center', marginTop: 12, fontSize: 15 }]}>
                        {CONNECTION_REQUIRED_MESSAGE}
                    </Text>
                    {!!connectionError && (
                        <Text style={{ textAlign: 'center', marginTop: 8, color: '#B91C1C', fontSize: 13 }}>
                            {connectionError}
                        </Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.centered, { paddingBottom: screenBottomPadding }]}>
            <Text style={styles.placeholderText}>Sohbet ekranı yakında.</Text>
        </SafeAreaView>
    );
};

export default ChatScreen;
