'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const screen = read('apps/mobile/src/features/clients/screens/SettingsScreen.js');
const viewModel = read('apps/mobile/src/features/clients/viewmodels/useSettingsViewModel.js');
const authScreen = read('apps/mobile/src/features/auth/screens/AuthScreen.js');
const login = read('apps/mobile/src/features/auth/components/LoginView.js');
const profile = read('apps/mobile/src/features/clients/screens/ProfileScreen.js');
const profileViewModel = read('apps/mobile/src/features/clients/viewmodels/useProfileViewModel.js');
const clientService = read('apps/mobile/src/features/clients/services/clientService.js');
const authService = read('apps/mobile/src/features/auth/services/authService.js');
const appConfig = read('app.json');
const rootNavigator = read('apps/mobile/src/navigation/RootNavigator.js');
const mainTabs = read('apps/mobile/src/navigation/MainTabs.js');
const sidebar = read('apps/mobile/src/features/clients/components/dashboard/DashboardSidebar.js');

test('Settings 1: renders only the required account and application sections', () => {
    for (const label of ['Hesap ve güvenlik', 'E-posta', 'Şifreyi değiştir', 'Hesabı sil', 'Uygulama', 'Sürüm', 'Çıkış yap']) {
        assert.match(screen, new RegExp(label));
    }
    assert.doesNotMatch(screen, /Bildirim tercihleri|Bildirimler|Su hatırlatıcıları/);
});

test('Settings 2: email is loaded from the current Auth user and no profile email is queried', () => {
    assert.match(viewModel, /getCurrentAuthenticatedUser\(\)/);
    assert.match(viewModel, /setEmail\(authUser\.user\.email/);
    assert.doesNotMatch(viewModel, /getCurrentUserProfile|clientService/);
    assert.doesNotMatch(screen, /profile\?\.email|Profile/);
});

test('Settings 3: app version comes from Expo runtime configuration', () => {
    assert.match(screen, /import Constants from 'expo-constants'/);
    assert.match(screen, /Constants\.expoConfig\?\.version \?\? Constants\.nativeAppVersion \?\? '—'/);
    assert.doesNotMatch(screen, /Sürüm 1\.0\.0/);
    assert.doesNotMatch(screen, /Sürüm \{appVersion\}/);
    assert.match(screen, /<Text style=\{styles\.value\}>\{appVersion\}<\/Text>/);
    assert.match(appConfig, /"version"\s*:\s*"1\.0\.0"/);
});

test('Settings 4: password form has current, new, and confirmation fields', () => {
    assert.match(screen, /label="Mevcut şifre"/);
    assert.match(screen, /label="Yeni şifre"/);
    assert.match(screen, /label="Yeni şifre tekrar"/);
    assert.match(screen, /PasswordToggle/);
    assert.match(screen, /Şifreyi güncelle/);
    assert.match(viewModel, /currentPassword/);
    assert.match(viewModel, /newPassword/);
    assert.match(viewModel, /confirmPassword/);
});

test('Settings 5: password validation requires all fields, matching confirmation, and a changed password', () => {
    assert.match(viewModel, /PASSWORD_REQUIRED_MESSAGE/);
    assert.match(viewModel, /newPassword !== confirmPassword/);
    assert.match(viewModel, /newPassword === currentPassword/);
    assert.match(viewModel, /PASSWORD_SAME_MESSAGE/);
});

test('Settings 6: password mutation is locked and clears fields after success', () => {
    const start = viewModel.indexOf('const submitPasswordChange');
    const end = viewModel.indexOf('const performAccountDeletion', start);
    const submit = viewModel.slice(start, end);
    assert.match(submit, /passwordLockRef\.current/);
    assert.match(submit, /changeAuthenticatedPassword\(\{ currentPassword, newPassword \}\)/);
    assert.match(submit, /setCurrentPassword\(''\)/);
    assert.match(submit, /setNewPassword\(''\)/);
    assert.match(submit, /setConfirmPassword\(''\)/);
    assert.match(submit, /Şifreniz güncellendi\./);
});

test('Settings 7: authenticated password change is distinct from recovery password update', () => {
    assert.match(viewModel, /changeAuthenticatedPassword/);
    assert.doesNotMatch(viewModel, /updatePassword|useResetPasswordViewModel|passwordRecovery/);
    assert.match(authService, /export const changeAuthenticatedPassword/);
    assert.match(authService, /signInWithPassword/);
    assert.match(authService, /updateUser\(\{ password: newPassword \}\)/);
});

test('Settings 8: deletion confirmation uses the required irreversible wording and actions', () => {
    assert.match(screen, /Hesabı sil/);
    assert.match(screen, /DietBridge hesabınız ve danışan hesabınıza bağlı veriler kalıcı olarak silinecek\. Bu işlem geri alınamaz\./);
    assert.match(screen, /\{ text: 'Vazgeç', style: 'cancel' \}/);
    assert.match(screen, /\{ text: DELETE_TITLE, style: 'destructive', onPress: confirmAccountDeletion \}/);
});

test('Settings 9: logout confirmation uses the required wording and canonical service result', () => {
    assert.match(screen, /DietBridge hesabından çıkış yapmak istiyor musunuz\?/);
    assert.match(screen, /\{ text: 'Vazgeç', style: 'cancel' \}/);
    assert.match(screen, /\{ text: 'Çıkış yap', style: 'destructive', onPress: confirmLogout \}/);
    assert.match(viewModel, /const result = await signOut\(\)/);
    assert.match(viewModel, /if \(!result\?\.ok\)/);
    assert.doesNotMatch(screen, /navigation\.navigate\(['"]Auth|navigation\.reset/);
});

test('Settings 10: pending deletion disables password and logout actions and offers a retry', () => {
    assert.match(viewModel, /DELETION_PHASES\.REMOTE_PENDING/);
    assert.match(viewModel, /deletionPhase !== DELETION_PHASES\.IDLE/);
    assert.match(screen, /operationsDisabled = loading \|\| isBusy \|\| isDeletionLocked/);
    assert.match(screen, /Hesap silme işlemini tekrar dene/);
    assert.match(screen, /retryAccountDeletion/);
    assert.match(screen, /disabled=\{operationsDisabled\}/);
});

test('Settings 11: local cleanup failure offers only a local cleanup retry', () => {
    assert.match(viewModel, /DELETION_PHASES\.CLEANUP_FAILED/);
    assert.match(viewModel, /retryLocalAccountDeletionCleanup\(\)/);
    assert.match(viewModel, /getAccountDeletionCleanupState\(\{ userId: authUser\.user\.id \}\)/);
    assert.match(viewModel, /storedState\.state\?\.phase === ACCOUNT_DELETION_PHASES\.LOCAL_CLEANUP_PENDING/);
    assert.match(viewModel, /serverDeletionConfirmed: result\.phasePersisted !== true/);
    assert.match(authService, /Hesabınız silindi ancak bu cihazdaki oturum temizliği tamamlanamadı\./);
    assert.match(screen, /Oturumu temizlemeyi tekrar dene/);
    assert.match(screen, /deletionPhase === 'cleanup_failed' \? retryLocalCleanup : retryAccountDeletion/);
});

test('Settings 12: beforeRemove protects a mounted pending deletion flow from stale navigation', () => {
    assert.match(screen, /navigation\.addListener\('beforeRemove'/);
    assert.match(screen, /event\.preventDefault\(\)/);
    assert.match(screen, /!isDeletionLocked && !deletionLoading/);
});

test('Settings 13: Profile removes duplicate email, notification, switch, and logout controls', () => {
    assert.doesNotMatch(profile, /label: 'E-posta'/);
    assert.doesNotMatch(profile, /Bildirim tercihleri|Bildirimler|Su hatırlatıcıları|<Switch|ToggleRow|label="Çıkış yap"/);
    assert.doesNotMatch(profileViewModel, /notificationsEnabled|waterRemindersEnabled|handleLogout|signOut/);
});

test('Settings 14: Profile preserves the real profile sections and editing data', () => {
    for (const label of ['Kişisel bilgiler', 'Telefon', 'Güncel kilo', 'Hedef kilo', 'Boy', 'Sağlık bilgileri', 'Yaşam tarzı', 'Beslenme tercihleri', 'Günlük su hedefi']) {
        assert.match(profile, new RegExp(label));
    }
    assert.match(profileViewModel, /handleSaveProfile: saveProfile/);
    assert.match(profileViewModel, /saveWaterGoalLiters/);
});

test('Settings 15: duplicate client-service logout is removed after Profile migration', () => {
    assert.doesNotMatch(clientService, /export const signOut/);
    assert.doesNotMatch(clientService, /revokePushInstallationBestEffort/);
    assert.match(authService, /export const signOut = async \(\) =>/);
});

test('Settings 16: existing root stack, four tabs, and sidebar architecture stay unchanged', () => {
    assert.match(rootNavigator, /Stack\.Screen name="Settings" component=\{SettingsScreen\}/);
    assert.match(rootNavigator, /Stack\.Screen name="GroceryList"/);
    assert.equal((mainTabs.match(/<Tab\.Screen\s/g) || []).length, 4);
    for (const label of ['Ana Sayfa', 'Öğünler', 'Analiz', 'Sohbet']) assert.match(mainTabs, new RegExp(`name="${label}"`));
    assert.doesNotMatch(sidebar, /GroceryList|Alışveriş listesi/);
});

test('Settings 17: Settings does not add dependencies, navigation routes, or backend calls', () => {
    assert.doesNotMatch(screen, /supabase|fetch\(|axios|install|package\.json|App\.js/);
    assert.doesNotMatch(viewModel, /supabase|fetch\(|axios/);
    assert.doesNotMatch(screen, /navigation\.navigate/);
});

test('Settings 18: Login receives conditional pending-deletion and local-cleanup notices', () => {
    assert.match(authScreen, /pendingAccountDeletion=\{hasPendingAccountDeletion\}/);
    assert.match(authScreen, /onRetryAccountDeletionCleanup=\{handleRetryAccountDeletionCleanup\}/);
    assert.match(login, /InlineAlert/);
    assert.match(login, /Bekleyen hesap silme işlemini tamamlamak için aynı hesapla giriş yapın\./);
    assert.match(login, /Oturumu temizlemeyi tekrar dene/);
});
