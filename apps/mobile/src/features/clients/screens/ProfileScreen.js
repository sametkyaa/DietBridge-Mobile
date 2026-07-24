import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppSkeleton, ErrorState, Icon, InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import {
    AvatarPreviewSheet,
    AvatarActionModal,
    DietitianProfileCard,
    ProfileEditSheet,
    ProfileFieldSheet,
    ProfileHeaderCard,
    ProfileSectionCard,
} from '../components/profile';
import MultiSelectProfileModal from '../components/MultiSelectProfileModal';
import NumericProfileInputModal from '../components/NumericProfileInputModal';
import {
    COMMON_CHRONIC_CONDITIONS,
    COMMON_FOOD_INTOLERANCES,
    COMMON_MEDICATIONS,
} from '../constants/profileOptions';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';

const FIELD_META = {
    bloodTypeId: { title: 'Kan grubunu düzenle', optionKey: 'bloodTypes' },
    lastLabDate: { title: 'Son tahlil tarihini düzenle', placeholder: 'YYYY-AA-GG' },
    activityLevelId: { title: 'Aktivite seviyesini düzenle', optionKey: 'activityLevel' },
    smokingStatus: { title: 'Sigara kullanımını düzenle', optionKey: 'smokingStatus' },
    alcoholStatusId: { title: 'Alkol kullanımını düzenle', optionKey: 'alcoholStatus' },
    nutritionTypeId: { title: 'Beslenme tipini düzenle', optionKey: 'nutritionType' },
    goalId: { title: 'Beslenme hedefini düzenle', optionKey: 'clientGoals' },
    dislikedFoods: { title: 'Sevilmeyen besinleri düzenle', placeholder: 'Virgülle ayırarak girin', multiline: true },
};

const display = (value, unit = '') => (value === null || value === undefined || value === '' ? '' : `${value}${unit ? ` ${unit}` : ''}`);

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const vm = useProfileViewModel();
    const {
        profile, loading, userName, avatarUrl, clientData, notificationsEnabled, setNotificationsEnabled,
        waterRemindersEnabled, setWaterRemindersEnabled, handleLogout, isEditing, cancelEditing,
        startEditing, editForm, updateField, handleSaveProfile, editingField, setEditingField, editingValue,
        setEditingValue, editingInitialValue, handleRowEdit, handleRowSave, waterGoalLiters, sleepHours, saveChronicConditions,
        saveMedications, saveFoodIntolerances, saveWaterGoalLiters, saveAverageSleepHours, handleAvatarUpload,
        isAvatarActionMenuVisible, hasAvatar, closeAvatarActionMenu, handleAvatarSource, handleAvatarRemoval,
        pendingAvatarUri, cancelSelectedAvatar, saveSelectedAvatar, catalogs, profileOptions,
        isSaving, isSelectingAvatar, isUploadingAvatar, error, successMessage, validationErrors, hasUnsavedChanges,
        activeDietitian, hasActiveDietitian, isLoadingConnection, connectionError, isDietitianCardExpanded,
        handleDietitianCardToggle, retry,
    } = vm;

    const closeGenericEditor = () => {
        if (isSaving) return;
        if (!hasUnsavedChanges) {
            cancelEditing();
            return;
        }
        Alert.alert('Kaydedilmemiş değişiklikler', 'Değişiklikleri kaydetmeden çıkmak istiyor musunuz?', [
            { text: 'Düzenlemeye devam et', style: 'cancel' },
            { text: 'Kaydetmeden çık', style: 'destructive', onPress: cancelEditing },
        ]);
    };

    const closeFieldEditor = () => {
        if (isSaving) return;
        if (String(editingValue) === String(editingInitialValue)) {
            setEditingField(null);
            return;
        }
        Alert.alert('Kaydedilmemiş değişiklikler', 'Bu alandaki değişiklikleri kaydetmeden çıkmak istiyor musunuz?', [
            { text: 'Düzenlemeye devam et', style: 'cancel' },
            { text: 'Kaydetmeden çık', style: 'destructive', onPress: () => setEditingField(null) },
        ]);
    };

    const genericField = FIELD_META[editingField];
    const genericOptions = useMemo(() => {
        if (!genericField?.optionKey) return undefined;
        if (genericField.optionKey === 'bloodTypes') return catalogs.bloodTypes;
        return profileOptions[genericField.optionKey] || [];
    }, [catalogs.bloodTypes, genericField, profileOptions]);

    const medicalRows = [
        { key: 'chronic', label: 'Kronik rahatsızlıklar', value: clientData.medicalInfo.chronicDiseases, onPress: () => handleRowEdit('chronicConditions') },
        { key: 'medications', label: 'Kullanılan ilaçlar', value: clientData.medicalInfo.medications, onPress: () => handleRowEdit('medications') },
        { key: 'blood', label: 'Kan grubu', value: clientData.medicalInfo.bloodType, onPress: () => handleRowEdit('bloodTypeId') },
        { key: 'lab', label: 'Son tahlil tarihi', value: clientData.medicalInfo.lastTestDate, onPress: () => handleRowEdit('lastLabDate') },
    ];
    const lifestyleRows = [
        { key: 'sleep', label: 'Ortalama uyku', value: clientData.lifestyle.sleep, onPress: () => handleRowEdit('sleepHours') },
        { key: 'activity', label: 'Aktivite seviyesi', value: clientData.lifestyle.activity, onPress: () => handleRowEdit('activityLevelId') },
        { key: 'smoking', label: 'Sigara kullanımı', value: clientData.lifestyle.smokingStatus, onPress: () => handleRowEdit('smokingStatus') },
        { key: 'alcohol', label: 'Alkol kullanımı', value: clientData.lifestyle.alcoholStatus, onPress: () => handleRowEdit('alcoholStatusId') },
    ];
    const nutritionRows = [
        { key: 'type', label: 'Beslenme tipi', value: clientData.dietDetails.dietType, onPress: () => handleRowEdit('nutritionTypeId') },
        { key: 'goal', label: 'Beslenme hedefi', value: clientData.goal, onPress: () => handleRowEdit('goalId') },
        { key: 'intolerance', label: 'Besin intoleransları', value: clientData.dietDetails.intolerance, onPress: () => handleRowEdit('foodIntolerances') },
        { key: 'dislikes', label: 'Sevilmeyen besinler', value: clientData.dietDetails.dislikes, onPress: () => handleRowEdit('dislikedFoods') },
        { key: 'water', label: 'Günlük su hedefi', value: clientData.dietDetails.waterTarget, onPress: () => handleRowEdit('dailyWaterGoalMl') },
    ];

    if (loading) return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}><View style={styles.loading} accessible accessibilityRole="progressbar" accessibilityLabel="Profil bilgileri yükleniyor" accessibilityState={{ busy: true }}><AppSkeleton width="45%" height={28} animated /><AppSkeleton height={150} animated style={styles.gap} /><AppSkeleton height={220} animated style={styles.gap} /><Text style={styles.loadingText}>Profil bilgileri yükleniyor...</Text></View></SafeAreaView>
    );
    if (error && !profile) return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}><View style={styles.centered}><AppCard><ErrorState title="Profil yüklenemedi" description="Profil bilgileri yüklenemedi. Lütfen tekrar deneyin." onRetry={retry} /></AppCard></View></SafeAreaView>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            <View style={styles.topBar}>
                <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Geri" style={({ pressed }) => [styles.back, pressed && styles.pressed]}><Icon name="back" size={22} /></Pressable>
                <Text style={styles.topTitle} accessibilityRole="header">Profilim</Text><View style={styles.back} />
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {error ? <InlineAlert variant="error" message="Bazı profil bilgileri yüklenemedi. Lütfen tekrar deneyin." /> : null}
                {successMessage ? <InlineAlert variant="success" message={successMessage} /> : null}
                <ProfileHeaderCard name={userName} avatarUrl={avatarUrl} isSelecting={isSelectingAvatar} isUploading={isUploadingAvatar} onAvatarPress={handleAvatarUpload} onEdit={startEditing} />
                <AppCard>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Özet</Text>
                    <View style={styles.stats}>
                        {[['Boy', display(clientData.height, 'cm')], ['Güncel kilo', display(clientData.currentWeight, 'kg')], ['Hedef kilo', display(clientData.targetWeight, 'kg')], ['Uyum skoru', clientData.complianceScore == null ? '' : `${clientData.complianceScore}/100`]].map(([label, value]) => <View key={label} style={styles.stat}><Text style={styles.statLabel}>{label}</Text><Text style={styles.statValue}>{value || '—'}</Text></View>)}
                    </View>
                </AppCard>
                <DietitianProfileCard loading={isLoadingConnection} dietitian={activeDietitian} hasActive={hasActiveDietitian} error={connectionError} expanded={isDietitianCardExpanded} onToggle={handleDietitianCardToggle} />
                <ProfileSectionCard title="Kişisel bilgiler" icon="person" rows={[
                    { key: 'email', label: 'E-posta', value: profile?.email },
                    { key: 'phone', label: 'Telefon', value: profile?.phone },
                    { key: 'current', label: 'Güncel kilo', value: display(clientData.currentWeight, 'kg') },
                    { key: 'target', label: 'Hedef kilo', value: display(clientData.targetWeight, 'kg') },
                    { key: 'height', label: 'Boy', value: display(clientData.height, 'cm') },
                ]} />
                <ProfileSectionCard title="Sağlık bilgileri" icon="heartPulse" rows={medicalRows} />
                <ProfileSectionCard title="Yaşam tarzı" icon="footprints" rows={lifestyleRows} />
                <ProfileSectionCard title="Beslenme tercihleri" icon="leaf" rows={nutritionRows} />
                <AppCard>
                    <Text style={styles.sectionTitle} accessibilityRole="header">Bildirim tercihleri</Text>
                    <Text style={styles.localNote}>Bu tercihler şu anda yalnızca bu cihaz oturumu için geçicidir.</Text>
                    <ToggleRow label="Bildirimler" value={notificationsEnabled} onChange={setNotificationsEnabled} />
                    <ToggleRow label="Su hatırlatıcıları" value={waterRemindersEnabled} onChange={setWaterRemindersEnabled} />
                </AppCard>
                <AppButton variant="secondary" label="Çıkış yap" onPress={handleLogout} icon={<Icon name="logout" size={18} color={colors.primaryDark} />} />
            </ScrollView>

            <ProfileEditSheet visible={isEditing} form={editForm} onChange={updateField} onSave={handleSaveProfile} onClose={closeGenericEditor} isSaving={isSaving} error={validationErrors.form} bottomInset={insets.bottom} />
            <ProfileFieldSheet visible={!!genericField} title={genericField?.title} value={editingValue} options={genericOptions} multiline={genericField?.multiline} placeholder={genericField?.placeholder} onChange={setEditingValue} onSave={handleRowSave} onClose={closeFieldEditor} isSaving={isSaving} error={validationErrors[editingField]} bottomInset={insets.bottom} />
            <AvatarPreviewSheet uri={pendingAvatarUri} onSave={saveSelectedAvatar} onClose={cancelSelectedAvatar} isUploading={isUploadingAvatar} bottomInset={insets.bottom} />
            <AvatarActionModal
                visible={isAvatarActionMenuVisible}
                hasAvatar={hasAvatar}
                onClose={closeAvatarActionMenu}
                onSelectSource={handleAvatarSource}
                onRemove={handleAvatarRemoval}
                disabled={isSelectingAvatar || isUploadingAvatar}
            />
            <MultiSelectProfileModal visible={editingField === 'chronicConditions'} title="Kronik rahatsızlıkları düzenle" options={COMMON_CHRONIC_CONDITIONS} selectedValues={profile?.chronicConditions || []} customInputLabel="Listede olmayan rahatsızlığı ekle" customInputPlaceholder="Rahatsızlık adı girin" loading={isSaving} onClose={() => setEditingField(null)} onSave={saveChronicConditions} />
            <MultiSelectProfileModal visible={editingField === 'medications'} title="Kullanılan ilaçları düzenle" options={COMMON_MEDICATIONS} selectedValues={profile?.medications || []} customInputLabel="Listede olmayan ilacı ekle" customInputPlaceholder="İlaç adı girin" loading={isSaving} onClose={() => setEditingField(null)} onSave={saveMedications} />
            <MultiSelectProfileModal visible={editingField === 'foodIntolerances'} title="Besin intoleranslarını düzenle" options={COMMON_FOOD_INTOLERANCES} selectedValues={profile?.foodIntolerances || []} customInputLabel="Listede olmayan intoleransı ekle" customInputPlaceholder="İntolerans adı girin" loading={isSaving} onClose={() => setEditingField(null)} onSave={saveFoodIntolerances} />
            <NumericProfileInputModal visible={editingField === 'dailyWaterGoalMl'} title="Su hedefini düzenle" value={waterGoalLiters} unit="L" placeholder="Örn. 2,5" minimum={0.5} maximum={10} step={0.1} loading={isSaving} validationMessage="Lütfen 0,5 ile 10 litre arasında geçerli bir değer girin." onClose={() => setEditingField(null)} onSave={saveWaterGoalLiters} />
            <NumericProfileInputModal visible={editingField === 'sleepHours'} title="Uyku düzenini düzenle" value={sleepHours} unit="saat" placeholder="Örn. 7,5" minimum={0} maximum={24} step={0.5} loading={isSaving} validationMessage="Lütfen 0 ile 24 saat arasında geçerli bir değer girin." onClose={() => setEditingField(null)} onSave={saveAverageSleepHours} />
        </SafeAreaView>
    );
};

function ToggleRow({ label, value, onChange }) {
    return <View style={styles.toggleRow}><Text style={styles.toggleLabel}>{label}</Text><Switch value={value} onValueChange={onChange} accessibilityLabel={label} accessibilityRole="switch" accessibilityState={{ checked: value }} trackColor={{ false: colors.borderSoft, true: colors.primarySoft }} thumbColor={value ? colors.primaryDark : colors.textTertiary} /></View>;
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.x3 },
    back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    topTitle: { ...typography.cardTitle, color: colors.textPrimary, flex: 1, textAlign: 'center' },
    content: { paddingHorizontal: spacing.x5, paddingBottom: spacing.x8, gap: spacing.x4 },
    loading: { flex: 1, padding: spacing.x5 }, gap: { marginTop: spacing.x4 },
    loadingText: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.x4 },
    centered: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.x5 },
    sectionTitle: { ...typography.sectionTitle, color: colors.textPrimary },
    stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2, marginTop: spacing.x3 },
    stat: { minWidth: 92, flexGrow: 1, flexBasis: '28%', backgroundColor: colors.surfaceMuted, padding: spacing.x3, borderRadius: 14 },
    statLabel: { ...typography.caption, color: colors.textSecondary },
    statValue: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    localNote: { ...typography.supporting, color: colors.textSecondary, marginTop: spacing.x1 },
    toggleRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.borderSoft, marginTop: spacing.x2 },
    toggleLabel: { ...typography.bodyMedium, color: colors.textPrimary, flex: 1 },
    pressed: { opacity: 0.8 },
});

export default ProfileScreen;
