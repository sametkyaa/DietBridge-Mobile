import React from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';

export default function ForgotPasswordScreen({ navigation }) {
    const {
        email,
        setEmail,
        loading,
        errorMessage,
        successMessage,
        isEmailFocused,
        setIsEmailFocused,
        handleSubmit,
    } = useForgotPasswordViewModel();

    const handleBackToLogin = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }

        navigation.navigate('Login');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#E0F7FA', '#F0F4F8']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <View style={styles.logoContainer}>
                                <Image
                                    source={require('../../../../../../assets/logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>Şifremi Unuttum</Text>
                            <Text style={styles.subtitle}>
                                E-posta adresinizi girin, şifre sıfırlama bağlantısını mail kutunuza gönderelim.
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>E-posta</Text>
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        isEmailFocused && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="mail-outline"
                                        size={20}
                                        color={isEmailFocused ? '#00796B' : '#90A4AE'}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ornek@email.com"
                                        placeholderTextColor="#B0BEC5"
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        keyboardType="email-address"
                                        textContentType="emailAddress"
                                        returnKeyType="send"
                                        editable={!loading}
                                        onSubmitEditing={handleSubmit}
                                        onFocus={() => setIsEmailFocused(true)}
                                        onBlur={() => setIsEmailFocused(false)}
                                    />
                                </View>
                            </View>

                            {!!errorMessage && (
                                <View style={[styles.messageBox, styles.errorBox]}>
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={20}
                                        color="#C62828"
                                        style={styles.messageIcon}
                                    />
                                    <Text style={[styles.messageText, styles.errorText]}>
                                        {errorMessage}
                                    </Text>
                                </View>
                            )}

                            {!!successMessage && (
                                <View style={[styles.messageBox, styles.successBox]}>
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={20}
                                        color="#2E7D32"
                                        style={styles.messageIcon}
                                    />
                                    <Text style={[styles.messageText, styles.successText]}>
                                        {successMessage}
                                    </Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.buttonText}>Sıfırlama Linki Gönder</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>Şifrenizi hatırladınız mı?</Text>
                                <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
                                    <Text style={styles.footerLink}>Giriş ekranına dön</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#00796B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        overflow: 'hidden',
    },
    logo: {
        width: '70%',
        height: '70%',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#263238',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        color: '#546E7A',
        textAlign: 'center',
        paddingHorizontal: 8,
    },
    formContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#37474F',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#ECEFF1',
        height: 56,
        paddingHorizontal: 16,
    },
    inputWrapperFocused: {
        borderColor: '#00796B',
        backgroundColor: '#FFFFFF',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#263238',
        height: '100%',
    },
    messageBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        marginBottom: 16,
    },
    errorBox: {
        backgroundColor: '#FFEBEE',
        borderColor: '#EF9A9A',
    },
    successBox: {
        backgroundColor: '#E8F5E9',
        borderColor: '#A5D6A7',
    },
    messageIcon: {
        marginRight: 8,
        marginTop: 1,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
    errorText: {
        color: '#C62828',
    },
    successText: {
        color: '#2E7D32',
    },
    button: {
        backgroundColor: '#00796B',
        borderRadius: 12,
        minHeight: 56,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 4,
        shadowColor: '#00796B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.75,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    footer: {
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#78909C',
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    footerLink: {
        color: '#00796B',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
