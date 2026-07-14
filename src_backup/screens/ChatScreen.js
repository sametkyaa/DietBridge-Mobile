import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../theme/styles';

const ChatScreen = () => (
  <SafeAreaView style={styles.centered}>
    <Text style={styles.placeholderText}>Sohbet ekranı yakında.</Text>
  </SafeAreaView>
);

export default ChatScreen;
