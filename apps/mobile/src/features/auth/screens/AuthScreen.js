import React from 'react';
import { AuthShell, LoginView, RegisterView } from '../components';
import { useAuthViewModel } from '../viewmodels/useAuthViewModel';

export default function AuthScreen({ navigation }) {
  const {
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
    isConfirmPasswordVisible,
    toggleConfirmPasswordVisibility,
    hasPendingAccountDeletion,
    accountDeletionSuccessMessage,
    accountDeletionCleanupError,
    accountDeletionCleanupAvailable,
    accountDeletionCleanupLoading,
    handleRetryAccountDeletionCleanup,
    isSignIn,
    handleAuth,
  } = useAuthViewModel();

  return (
    <AuthShell>
      {isSignIn ? (
        <LoginView
          email={email}
          password={password}
          isPasswordVisible={isPasswordVisible}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onTogglePassword={togglePasswordVisibility}
          onSubmit={handleAuth}
          onForgotPassword={() => navigation.navigate('ForgotPassword')}
          onRegister={() => setMode('signup')}
          pendingAccountDeletion={hasPendingAccountDeletion}
          accountDeletionSuccessMessage={accountDeletionSuccessMessage}
          accountDeletionCleanupError={accountDeletionCleanupError}
          accountDeletionCleanupAvailable={accountDeletionCleanupAvailable}
          accountDeletionCleanupLoading={accountDeletionCleanupLoading}
          onRetryAccountDeletionCleanup={handleRetryAccountDeletionCleanup}
        />
      ) : (
        <RegisterView
          fullName={fullName}
          phone={phone}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          isPasswordVisible={isPasswordVisible}
          isConfirmPasswordVisible={isConfirmPasswordVisible}
          loading={loading}
          onFullNameChange={setFullName}
          onPhoneChange={setPhone}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onTogglePassword={togglePasswordVisibility}
          onToggleConfirmPassword={toggleConfirmPasswordVisibility}
          onSubmit={handleAuth}
          onLogin={() => setMode('signin')}
        />
      )}
    </AuthShell>
  );
}
