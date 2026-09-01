import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthScreen from '../features/auth/screens/AuthScreen';
import ForgotPasswordScreen from '../features/auth/screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../features/auth/screens/ResetPasswordScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = ({
    initialRouteName = 'Login',
    recoveryStatus = 'idle',
    recoveryError = null,
    onRecoverySuccess,
    onRecoveryCancel,
    onRequestAnotherLink,
}) => {
    return (
        <Stack.Navigator initialRouteName={initialRouteName} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={AuthScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword">
                {(screenProps) => (
                    <ResetPasswordScreen
                        {...screenProps}
                        recoveryStatus={recoveryStatus}
                        recoveryError={recoveryError}
                        onRecoverySuccess={onRecoverySuccess}
                        onRecoveryCancel={onRecoveryCancel}
                        onRequestAnotherLink={onRequestAnotherLink}
                    />
                )}
            </Stack.Screen>
        </Stack.Navigator>
    );
};

export default AuthNavigator;
