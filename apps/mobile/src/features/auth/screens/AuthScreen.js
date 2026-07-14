import React from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

export default function AuthScreen({ navigation }) {
    const {
        mode,
        setMode,
        email,
        setEmail,
        password,
        setPassword,
        fullName,
        setFullName,
        phone,
        setPhone,
        confirmPassword,
        setConfirmPassword,
        loading,
        isPasswordVisible,
        togglePasswordVisibility,
        isEmailFocused,
        setIsEmailFocused,
        isPasswordFocused,
        setIsPasswordFocused,
        isNameFocused,
        setIsNameFocused,
        isPhoneFocused,
        setIsPhoneFocused,
        isConfirmPasswordFocused,
        setIsConfirmPasswordFocused,
        isSignIn,
        handleAuth,
    } = useAuthViewModel();

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
                                {/* Note: Ensure require path is correct or update asset location */}
                                <Image
                                    source={require('../../../../../../assets/logo.png')}
                                    style={styles.logo}
                                    resizeMode="contain"
                                />
                            </View>
                            <Text style={styles.title}>DietBridge</Text>
                            <Text style={styles.subtitle}>
                                {isSignIn ? 'Tekrar Hoşgeldiniz!' : 'Sağlıklı Yaşama Adım Atın'}
                            </Text>
                        </View>

                        <View style={styles.formContainer}>
                            {!isSignIn && (
                                <>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Ad Soyad</Text>
                                        <View
                                            style={[
                                                styles.inputWrapper,
                                                isNameFocused && styles.inputWrapperFocused,
                                            ]}
                                        >
                                            <Ionicons
                                                name="person-outline"
                                                size={20}
                                                color={isNameFocused ? '#00796B' : '#90A4AE'}
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="Adınız Soyadınız"
                                                placeholderTextColor="#B0BEC5"
                                                value={fullName}
                                                onChangeText={setFullName}
                                                autoCapitalize="words"
                                                onFocus={() => setIsNameFocused(true)}
                                                onBlur={() => setIsNameFocused(false)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.label}>Telefon</Text>
                                        <View
                                            style={[
                                                styles.inputWrapper,
                                                isPhoneFocused && styles.inputWrapperFocused,
                                            ]}
                                        >
                                            <Ionicons
                                                name="call-outline"
                                                size={20}
                                                color={isPhoneFocused ? '#00796B' : '#90A4AE'}
                                                style={styles.inputIcon}
                                            />
                                            <TextInput
                                                style={styles.input}
                                                placeholder="05xx xxx xx xx"
                                                placeholderTextColor="#B0BEC5"
                                                value={phone}
                                                onChangeText={setPhone}
                                                keyboardType="phone-pad"
                                                onFocus={() => setIsPhoneFocused(true)}
                                                onBlur={() => setIsPhoneFocused(false)}
                                            />
                                        </View>
                                    </View>
                                </>
                            )}

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
                                        keyboardType="email-address"
                                        onFocus={() => setIsEmailFocused(true)}
                                        onBlur={() => setIsEmailFocused(false)}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Şifre</Text>
                                <View
                                    style={[
                                        styles.inputWrapper,
                                        isPasswordFocused && styles.inputWrapperFocused,
                                    ]}
                                >
                                    <Ionicons
                                        name="lock-closed-outline"
                                        size={20}
                                        color={isPasswordFocused ? '#00796B' : '#90A4AE'}
                                        style={styles.inputIcon}
                                    />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="••••••••"
                                        placeholderTextColor="#B0BEC5"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!isPasswordVisible}
                                        onFocus={() => setIsPasswordFocused(true)}
                                        onBlur={() => setIsPasswordFocused(false)}
                                    />
                                    <TouchableOpacity
                                        style={styles.passwordVisibilityButton}
                                        onPress={togglePasswordVisibility}
                                        disabled={loading}
                                        accessibilityLabel={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
                                    >
                                        <Ionicons
                                            name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                                            size={22}
                                            color={isPasswordFocused ? '#00796B' : '#90A4AE'}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {!isSignIn && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Şifre Tekrar</Text>
                                    <View
                                        style={[
                                            styles.inputWrapper,
                                            isConfirmPasswordFocused && styles.inputWrapperFocused,
                                        ]}
                                    >
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={20}
                                            color={isConfirmPasswordFocused ? '#00796B' : '#90A4AE'}
                                            style={styles.inputIcon}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="••••••••"
                                            placeholderTextColor="#B0BEC5"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry={!isPasswordVisible}
                                            onFocus={() => setIsConfirmPasswordFocused(true)}
                                            onBlur={() => setIsConfirmPasswordFocused(false)}
                                        />
                                    </View>
                                </View>
                            )}

                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {isSignIn ? 'Giriş Yap' : 'Kayıt Ol'}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {isSignIn && (
                                <TouchableOpacity
                                    style={styles.forgotPasswordButton}
                                    onPress={() => navigation.navigate('ForgotPassword')}
                                    disabled={loading}
                                >
                                    <Text style={styles.forgotPasswordText}>Şifremi unuttum</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    {isSignIn ? 'Hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                                </Text>
                                <TouchableOpacity onPress={() => setMode(isSignIn ? 'signup' : 'signin')}>
                                    <Text style={styles.footerLink}>
                                        {isSignIn ? 'Kayıt Olun' : 'Giriş Yapın'}
                                    </Text>
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
        marginBottom: 40,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#ffffff',
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
        fontSize: 32,
        fontWeight: 'bold',
        color: '#263238',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#546E7A',
        textAlign: 'center',
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
        marginBottom: 20,
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
    passwordVisibilityButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginLeft: 8,
    },
    button: {
        backgroundColor: '#00796B',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#00796B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: 12,
        marginBottom: 0,
        paddingVertical: 8,
        paddingHorizontal: 4,
    },
    forgotPasswordText: {
        color: '#00796B',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    footerText: {
        color: '#78909C',
        fontSize: 14,
        marginRight: 4,
    },
    footerLink: {
        color: '#00796B',
        fontSize: 14,
        fontWeight: 'bold',
    },
});
