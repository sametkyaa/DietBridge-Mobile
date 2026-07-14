import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Image,
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    TextInput,
    TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import MultiSelectProfileModal from '../components/MultiSelectProfileModal';
import NumericProfileInputModal from '../components/NumericProfileInputModal';
import {
    COMMON_CHRONIC_CONDITIONS,
    COMMON_FOOD_INTOLERANCES,
    COMMON_MEDICATIONS,
} from '../constants/profileOptions';

const SPECIALIZED_PROFILE_FIELDS = new Set([
    'chronicConditions',
    'medications',
    'foodIntolerances',
    'sleepHours',
    'dailyWaterGoalMl',
]);

// Reusable Menu Item Component
const MenuItem = ({
    icon,
    title,
    value,
    isDestructive = false,
    hasToggle = false,
    isToggled = false,
    onToggle,
    onPress,
    valueStyle,
    isBadge = false
}) => (
    <TouchableOpacity
        style={styles.menuItem}
        onPress={onPress}
        disabled={hasToggle}
        activeOpacity={0.7}
        accessibilityRole={hasToggle ? undefined : 'button'}
    >
        <View style={styles.menuLeft}>
            <View style={[styles.iconBox, isDestructive && styles.iconBoxDestructive]}>
                <Ionicons name={icon} size={22} color={isDestructive ? '#EF4444' : '#4B5563'} />
            </View>
            <Text
                style={[styles.menuTitle, isDestructive && styles.textDestructive]}
                numberOfLines={2}
            >
                {title}
            </Text>
        </View>

        <View style={styles.menuRight}>
            {hasToggle ? (
                <Switch
                    trackColor={{ false: '#E5E7EB', true: '#A7F3D0' }}
                    thumbColor={isToggled ? '#4CAF50' : '#f4f3f4'}
                    ios_backgroundColor="#E5E7EB"
                    onValueChange={onToggle}
                    value={isToggled}
                />
            ) : (
                <>
                    {value ? (
                        <View style={isBadge && styles.badge}>
                            <Text style={[
                                styles.menuValue,
                                valueStyle,
                                isBadge && styles.badgeText
                            ]} numberOfLines={1} ellipsizeMode="tail">
                                {value}
                            </Text>
                        </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </>
            )}
        </View>
    </TouchableOpacity>
);

// Stat Card Component
const StatCard = ({ title, value, highlight = false }) => (
    <View style={styles.statCard}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, highlight && styles.textPrimary]}>{value}</Text>
    </View>
);

const ProfileScreen = ({ navigation }) => {
    const {
        profile,
        loading,
        userName,
        avatarUrl,
        clientData,
        notificationsEnabled,
        setNotificationsEnabled,
        waterRemindersEnabled,
        setWaterRemindersEnabled,
        handleLogout,
        isEditing,
        handleEditToggle,
        editForm,
        setEditForm,
        handleSaveProfile,
        editingField,
        setEditingField,
        editingValue,
        setEditingValue,
        handleRowEdit,
        handleRowSave,
        waterGoalLiters,
        sleepHours,
        saveChronicConditions,
        saveMedications,
        saveFoodIntolerances,
        saveWaterGoalLiters,
        saveAverageSleepHours,
        handleAvatarUpload,
        pendingAvatarUri,
        cancelSelectedAvatar,
        saveSelectedAvatar,
        catalogs,
        profileOptions,
        isSaving,
        isSelectingAvatar,
        isUploadingAvatar,
        error,
        validationErrors,
        emptyMeasurementText,
        activeDietitian,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        isDietitianCardExpanded,
        handleDietitianCardToggle,
    } = useProfileViewModel();

    const handleAvatarEdit = () => {
        handleAvatarUpload();
    };

    const formatStatValue = (value, unit) => (
        value === null || value === undefined || value === ''
            ? emptyMeasurementText
            : `${value} ${unit}`
    );

    const complianceText = (
        clientData.complianceScore === null || clientData.complianceScore === undefined
            ? ''
            : `${clientData.complianceScore}/100`
    );

    const getFieldLabel = (field) => {
        const labels = {
            'chronicConditions': 'Kronik Rahatsızlıklar',
            'medications': 'Kullanılan İlaçlar',
            'bloodTypeId': 'Kan Grubu',
            'lastLabDate': 'Son Tahlil Tarihi',
            'sleepHours': 'Uyku Düzeni',
            'activityLevelId': 'Aktivite Seviyesi',
            'smokingStatus': 'Sigara Kullanımı',
            'alcoholStatusId': 'Alkol Kullanımı',
            'nutritionTypeId': 'Beslenme Tipi',
            'goalId': 'Beslenme Hedefi',
            'foodIntolerances': 'Besin İntoleransları',
            'dislikedFoods': 'Sevilmeyen Besinler',
            'dailyWaterGoalMl': 'Su Hedefi'
        };
        return labels[field] || 'Düzenle';
    };

    const renderEditField = () => {
        if (!editingField) return null;

        if (editingField === 'bloodTypeId') {
            return (
                <View style={localStyles.chipContainer}>
                    {catalogs?.bloodTypes?.map(bt => (
                        <TouchableOpacity 
                            key={bt.id || bt.code} 
                            style={[localStyles.chip, String(editingValue) === String(bt.id) && localStyles.chipSelected]}
                            onPress={() => setEditingValue(bt.id)}
                        >
                            <Text style={[localStyles.chipText, String(editingValue) === String(bt.id) && localStyles.chipTextSelected]}>{bt.label || bt.code}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (editingField === 'activityLevelId' || editingField === 'smokingStatus' || editingField === 'alcoholStatusId' || editingField === 'nutritionTypeId' || editingField === 'goalId') {
            const optionMap = {
                activityLevelId: profileOptions.activityLevel,
                smokingStatus: profileOptions.smokingStatus,
                alcoholStatusId: profileOptions.alcoholStatus,
                nutritionTypeId: profileOptions.nutritionType,
                goalId: profileOptions.clientGoals,
            };
            const options = optionMap[editingField] || [];
            return (
                <View style={localStyles.chipContainer}>
                    {options.map(opt => (
                        <TouchableOpacity 
                            key={String(opt.id)} 
                            style={[localStyles.chip, String(editingValue) === String(opt.id) && localStyles.chipSelected]}
                            onPress={() => setEditingValue(opt.id)}
                        >
                            <Text style={[localStyles.chipText, String(editingValue) === String(opt.id) && localStyles.chipTextSelected]}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            );
        }

        if (editingField === 'dislikedFoods') {
            return (
                <TextInput
                    style={[localStyles.input, localStyles.multilineInput]}
                    value={String(editingValue || '')}
                    onChangeText={setEditingValue}
                    multiline
                    placeholder="Virgül ile ayırarak giriniz..."
                />
            );
        }

        if (editingField === 'lastLabDate') {
            return (
                <TextInput 
                    style={localStyles.input} 
                    value={String(editingValue || '')} 
                    onChangeText={setEditingValue} 
                    placeholder="YYYY-AA-GG"
                />
            );
        }

        return (
            <TextInput 
                style={localStyles.input} 
                value={String(editingValue || '')} 
                onChangeText={setEditingValue} 
                placeholder="Değer giriniz..."
            />
        );
    };

    const renderDietitianCard = () => {
        if (isLoadingConnection) {
            return (
                <View style={styles.section}>
                    <View style={localStyles.dietitianCard}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={localStyles.dietitianLoadingText}>Diyetisyen bilgisi yükleniyor...</Text>
                    </View>
                </View>
            );
        }

        if (!hasActiveDietitian || !activeDietitian) {
            return (
                <View style={styles.section}>
                    <View style={localStyles.dietitianCard}>
                        <View style={localStyles.dietitianCardHeader}>
                            <View style={localStyles.dietitianIconBox}>
                                <Ionicons name="person-circle-outline" size={22} color="#047857" />
                            </View>
                            <View style={localStyles.dietitianSummary}>
                                <Text style={localStyles.dietitianLabel}>Diyetisyen</Text>
                            </View>
                        </View>
                        {!!connectionError && <Text style={localStyles.dietitianError}>{connectionError}</Text>}
                    </View>
                </View>
            );
        }

        const dietitianAvatarUrl = activeDietitian.avatarSignedUrl || activeDietitian.avatarUrl;
        const dietitianName = String(activeDietitian.fullName || activeDietitian.name || '').trim();
        const details = [
            activeDietitian.email ? { label: 'E-posta', value: activeDietitian.email } : null,
            activeDietitian.specialization ? { label: 'Uzmanlık', value: activeDietitian.specialization } : null,
            activeDietitian.university ? { label: 'Okul', value: activeDietitian.university } : null,
            activeDietitian.experienceYears !== null && activeDietitian.experienceYears !== undefined
                ? { label: 'Deneyim', value: `${activeDietitian.experienceYears} yıl` }
                : null,
            activeDietitian.bio ? { label: 'Hakkında', value: activeDietitian.bio } : null,
        ].filter(Boolean);

        return (
            <View style={styles.section}>
                <TouchableOpacity
                    style={localStyles.dietitianCard}
                    onPress={handleDietitianCardToggle}
                    activeOpacity={0.8}
                >
                    <View style={localStyles.dietitianCardHeader}>
                        <View style={localStyles.dietitianIconBox}>
                            {dietitianAvatarUrl ? (
                                <Image source={{ uri: dietitianAvatarUrl }} style={localStyles.dietitianAvatar} />
                            ) : (
                                <Ionicons name="person-circle-outline" size={22} color="#047857" />
                            )}
                        </View>
                        <View style={localStyles.dietitianSummary}>
                            <Text style={localStyles.dietitianLabel}>Diyetisyen</Text>
                            {!!dietitianName && (
                                <Text
                                    style={localStyles.dietitianName}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {dietitianName}
                                </Text>
                            )}
                        </View>
                        <Ionicons
                            name={isDietitianCardExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#9CA3AF"
                        />
                    </View>

                    {isDietitianCardExpanded && (
                        <View style={localStyles.dietitianDetails}>
                            {details.length > 0 ? (
                                details.map((item) => (
                                    <View key={item.label} style={localStyles.dietitianDetailRow}>
                                        <Text style={localStyles.dietitianDetailLabel}>{item.label}</Text>
                                        <Text style={localStyles.dietitianDetailValue}>{item.value}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={localStyles.dietitianEmptyDetail}>
                                    Bu diyetisyen için ek profil bilgisi bulunmuyor.
                                </Text>
                            )}
                            {!!connectionError && <Text style={localStyles.dietitianError}>{connectionError}</Text>}
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profilim</Text>
                <TouchableOpacity onPress={handleEditToggle} style={styles.editButton}>
                    <Ionicons name="create-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatarPlaceholder} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={40} color="#9CA3AF" />
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.editBadge}
                            onPress={handleAvatarEdit}
                            disabled={isSelectingAvatar || isUploadingAvatar}
                            accessibilityRole="button"
                            accessibilityLabel="Profil fotoğrafı seç"
                            accessibilityState={{ disabled: isSelectingAvatar || isUploadingAvatar }}
                        >
                            {isSelectingAvatar || isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="pencil" size={12} color="#fff" />
                            )}
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{userName}</Text>

                    {!!clientData.goal && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{clientData.goal}</Text>
                        </View>
                    )}

                    {!!complianceText && (
                        <Text style={styles.dietitianInfo}>Uyum Skoru: {complianceText}</Text>
                    )}
                    {!!error && <Text style={localStyles.profileError}>{error}</Text>}
                </View>

                {renderDietitianCard()}

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard title="Boy" value={formatStatValue(clientData.height, 'cm')} />
                    <StatCard title="Kilo" value={formatStatValue(clientData.currentWeight, 'kg')} highlight />
                    <StatCard title="Hedef" value={formatStatValue(clientData.targetWeight, 'kg')} />
                </View>

                {/* Medical Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>TIBBI BİLGİLER</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="medkit-outline"
                            title="Kronik Rahatsızlıklar"
                            value={clientData.medicalInfo.chronicDiseases}
                            valueStyle={{ color: '#4B5563' }}
                            onPress={() => handleRowEdit('chronicConditions', clientData.medicalInfo.chronicDiseases)}
                        />
                        <MenuItem
                            icon="flask-outline"
                            title="Kullanılan İlaçlar"
                            value={clientData.medicalInfo.medications}
                            onPress={() => handleRowEdit('medications', clientData.medicalInfo.medications)}
                        />
                        <MenuItem
                            icon="water-outline"
                            title="Kan Grubu"
                            value={clientData.medicalInfo.bloodType}
                            onPress={() => handleRowEdit('bloodTypeId', clientData.medicalInfo.bloodType)}
                        />
                        <MenuItem
                            icon="calendar-outline"
                            title="Son Tahlil Tarihi"
                            value={clientData.medicalInfo.lastTestDate}
                            onPress={() => handleRowEdit('lastLabDate', clientData.medicalInfo.lastTestDate)}
                        />
                    </View>
                </View>

                {/* Lifestyle Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>YAŞAM TARZI</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="bed-outline"
                            title="Uyku Düzeni"
                            value={clientData.lifestyle.sleep}
                            onPress={() => handleRowEdit('sleepHours', clientData.lifestyle.sleep)}
                        />
                        <MenuItem
                            icon="walk-outline"
                            title="Aktivite Seviyesi"
                            value={clientData.lifestyle.activity}
                            onPress={() => handleRowEdit('activityLevelId', clientData.lifestyle.activity)}
                        />
                        <MenuItem
                            icon="flame-outline"
                            title="Sigara Kullanımı"
                            value={clientData.lifestyle.smokingStatus}
                            onPress={() => handleRowEdit('smokingStatus', clientData.lifestyle.smokingStatus)}
                        />
                        <MenuItem
                            icon="wine-outline"
                            title="Alkol Kullanımı"
                            value={clientData.lifestyle.alcoholStatus}
                            onPress={() => handleRowEdit('alcoholStatusId', clientData.lifestyle.alcoholStatus)}
                        />
                    </View>
                </View>

                {/* Nutritional Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>BESLENME DETAYLARI</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="restaurant-outline"
                            title="Beslenme Tipi"
                            value={clientData.dietDetails.dietType}
                            isBadge
                            onPress={() => handleRowEdit('nutritionTypeId', clientData.dietDetails.dietType)}
                        />
                        <MenuItem
                            icon="flag-outline"
                            title="Beslenme Hedefi"
                            value={clientData.goal}
                            isBadge
                            onPress={() => handleRowEdit('goalId', clientData.goal)}
                        />
                        <MenuItem
                            icon="alert-circle-outline"
                            title="Besin İntoleransları"
                            value={clientData.dietDetails.intolerance}
                            onPress={() => handleRowEdit('foodIntolerances', clientData.dietDetails.intolerance)}
                        />
                        <MenuItem
                            icon="ban-outline"
                            title="Sevilmeyen Besinler"
                            value={clientData.dietDetails.dislikes}
                            onPress={() => handleRowEdit('dislikedFoods', clientData.dietDetails.dislikes)}
                        />
                        <MenuItem
                            icon="water-outline"
                            title="Su Hedefi"
                            value={clientData.dietDetails.waterTarget}
                            onPress={() => handleRowEdit('dailyWaterGoalMl', clientData.dietDetails.waterTarget)}
                        />
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Ayarlar</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="notifications-outline"
                            title="Öğün Hatırlatıcıları"
                            hasToggle
                            isToggled={notificationsEnabled}
                            onToggle={setNotificationsEnabled}
                        />
                        <MenuItem
                            icon="water-outline"
                            title="Su Bildirimleri"
                            hasToggle
                            isToggled={waterRemindersEnabled}
                            onToggle={setWaterRemindersEnabled}
                        />
                        <MenuItem
                            icon="lock-closed-outline"
                            title="Şifre Değiştir"
                            onPress={() => Alert.alert('Bilgi', 'Şifre değiştirme ekranı yakında eklenecek.')}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versiyon 1.0.0</Text>
            </ScrollView>

            <Modal
                visible={!!pendingAvatarUri}
                animationType="fade"
                transparent
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={cancelSelectedAvatar}
            >
                <SafeAreaView style={localStyles.modalSafeArea} edges={['top', 'bottom']}>
                    <View style={localStyles.avatarPreviewOverlay}>
                        <View style={localStyles.avatarPreviewContainer}>
                            <Text style={localStyles.avatarPreviewTitle}>Profil Fotoğrafını Kaydet</Text>
                            {!!pendingAvatarUri && (
                                <Image
                                    source={{ uri: pendingAvatarUri }}
                                    style={localStyles.avatarPreviewImage}
                                    resizeMode="cover"
                                />
                            )}

                            <View style={localStyles.modalActions}>
                                <TouchableOpacity
                                    style={localStyles.cancelButton}
                                    onPress={cancelSelectedAvatar}
                                    disabled={isUploadingAvatar}
                                    accessibilityRole="button"
                                >
                                    <Text style={localStyles.cancelButtonText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[localStyles.saveButton, isUploadingAvatar && localStyles.disabledButton]}
                                    onPress={saveSelectedAvatar}
                                    disabled={isUploadingAvatar}
                                    accessibilityRole="button"
                                    accessibilityState={{ disabled: isUploadingAvatar, busy: isUploadingAvatar }}
                                >
                                    {isUploadingAvatar ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={localStyles.saveButtonText}>Kaydet</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>

            <Modal
                visible={isEditing}
                animationType="slide"
                transparent
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={handleEditToggle}
            >
                <SafeAreaView style={localStyles.modalSafeArea} edges={['top', 'bottom']}>
                    <KeyboardAvoidingView
                        style={localStyles.modalKeyboardContainer}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                            <View style={localStyles.modalOverlay}>
                                <View style={localStyles.modalContainer}>
                                    <Text style={localStyles.modalTitle}>Profili Düzenle</Text>
                                    <ScrollView
                                        style={{ width: '100%', maxHeight: 400 }}
                                        showsVerticalScrollIndicator={false}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        <Text style={localStyles.inputLabel}>Boy (cm)</Text>
                                        <TextInput style={localStyles.input} keyboardType="numeric" value={editForm.heightCm} onChangeText={(t) => setEditForm({ ...editForm, heightCm: t })} />

                                        <Text style={localStyles.inputLabel}>Ad Soyad</Text>
                                        <TextInput style={localStyles.input} value={editForm.fullName} onChangeText={(t) => setEditForm({ ...editForm, fullName: t })} />

                                        <Text style={localStyles.inputLabel}>Telefon</Text>
                                        <TextInput style={localStyles.input} value={editForm.phone} onChangeText={(t) => setEditForm({ ...editForm, phone: t })} keyboardType="phone-pad" />

                                        <Text style={localStyles.inputLabel}>Güncel Kilo (kg)</Text>
                                        <TextInput style={localStyles.input} keyboardType="numeric" value={editForm.currentWeight} onChangeText={(t) => setEditForm({ ...editForm, currentWeight: t })} />

                                        <Text style={localStyles.inputLabel}>Hedef Kilo (kg)</Text>
                                        <TextInput style={localStyles.input} keyboardType="numeric" value={editForm.targetWeight} onChangeText={(t) => setEditForm({ ...editForm, targetWeight: t })} />

                                        {!!validationErrors.form && <Text style={localStyles.fieldError}>{validationErrors.form}</Text>}
                                    </ScrollView>

                                    <View style={localStyles.modalActions}>
                                        <TouchableOpacity style={localStyles.cancelButton} onPress={handleEditToggle} disabled={isSaving}>
                                            <Text style={localStyles.cancelButtonText}>İptal</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[localStyles.saveButton, isSaving && localStyles.disabledButton]} onPress={handleSaveProfile} disabled={isSaving}>
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={localStyles.saveButtonText}>Kaydet</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            <Modal
                visible={!!editingField && !SPECIALIZED_PROFILE_FIELDS.has(editingField)}
                animationType="fade"
                transparent
                statusBarTranslucent
                navigationBarTranslucent
                onRequestClose={() => !isSaving && setEditingField(null)}
            >
                <SafeAreaView style={localStyles.modalSafeArea} edges={['top', 'bottom']}>
                    <KeyboardAvoidingView
                        style={localStyles.modalKeyboardContainer}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                            <View style={localStyles.modalOverlay}>
                                <View style={localStyles.modalContainer}>
                                    <Text style={localStyles.modalTitle}>{getFieldLabel(editingField)} Düzenle</Text>

                                    {renderEditField()}
                                    {!!editingField && !!validationErrors[editingField] && (
                                        <Text style={localStyles.fieldError}>{validationErrors[editingField]}</Text>
                                    )}

                                    <View style={localStyles.modalActions}>
                                        <TouchableOpacity style={localStyles.cancelButton} onPress={() => setEditingField(null)} disabled={isSaving}>
                                            <Text style={localStyles.cancelButtonText}>İptal</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[localStyles.saveButton, isSaving && localStyles.disabledButton]} onPress={handleRowSave} disabled={isSaving}>
                                            {isSaving ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={localStyles.saveButtonText}>Kaydet</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>

            <MultiSelectProfileModal
                visible={editingField === 'chronicConditions'}
                title="Kronik Rahatsızlıkları Düzenle"
                options={COMMON_CHRONIC_CONDITIONS}
                selectedValues={profile?.chronicConditions || []}
                customInputLabel="Listede olmayan rahatsızlığı ekle"
                customInputPlaceholder="Rahatsızlık adı girin"
                loading={isSaving}
                onClose={() => setEditingField(null)}
                onSave={saveChronicConditions}
            />

            <MultiSelectProfileModal
                visible={editingField === 'medications'}
                title="Kullanılan İlaçları Düzenle"
                options={COMMON_MEDICATIONS}
                selectedValues={profile?.medications || []}
                customInputLabel="Listede olmayan ilacı ekle"
                customInputPlaceholder="İlaç adı girin"
                loading={isSaving}
                onClose={() => setEditingField(null)}
                onSave={saveMedications}
            />

            <MultiSelectProfileModal
                visible={editingField === 'foodIntolerances'}
                title="Besin İntoleranslarını Düzenle"
                options={COMMON_FOOD_INTOLERANCES}
                selectedValues={profile?.foodIntolerances || []}
                customInputLabel="Listede olmayan intoleransı ekle"
                customInputPlaceholder="İntolerans adı girin"
                loading={isSaving}
                onClose={() => setEditingField(null)}
                onSave={saveFoodIntolerances}
            />

            <NumericProfileInputModal
                visible={editingField === 'dailyWaterGoalMl'}
                title="Su Hedefini Düzenle"
                value={waterGoalLiters}
                unit="L"
                placeholder="Örn. 2.5"
                minimum={0.5}
                maximum={10}
                step={0.1}
                loading={isSaving}
                validationMessage="Lütfen 0.5 ile 10 litre arasında geçerli bir değer girin."
                onClose={() => setEditingField(null)}
                onSave={saveWaterGoalLiters}
            />

            <NumericProfileInputModal
                visible={editingField === 'sleepHours'}
                title="Uyku Düzenini Düzenle"
                value={sleepHours}
                unit="saat"
                placeholder="Örn. 7.5"
                minimum={0}
                maximum={24}
                step={0.5}
                loading={isSaving}
                validationMessage="Lütfen 0 ile 24 saat arasında geçerli bir değer girin."
                onClose={() => setEditingField(null)}
                onSave={saveAverageSleepHours}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    editButton: {
        padding: 8,
        marginRight: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    statusText: {
        color: '#166534',
        fontSize: 13,
        fontWeight: '600',
    },
    dietitianInfo: {
        fontSize: 14,
        color: '#6B7280',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statTitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    textPrimary: {
        color: '#4CAF50',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    menuLeft: {
        flex: 1,
        minWidth: 0,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    iconBoxDestructive: {
        backgroundColor: '#FEE2E2',
    },
    menuTitle: {
        flexShrink: 1,
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    menuRight: {
        maxWidth: '48%',
        flexShrink: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    menuValue: {
        flexShrink: 1,
        fontSize: 14,
        color: '#6B7280',
        marginRight: 8,
    },
    textWarning: {
        color: '#EF4444',
        fontWeight: '500',
    },
    textDestructive: {
        color: '#EF4444',
    },
    badge: {
        flexShrink: 1,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#166534',
        fontWeight: '600',
        fontSize: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 24,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    versionText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 20,
    },
});

const localStyles = StyleSheet.create({
    dietitianCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dietitianCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dietitianIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        overflow: 'hidden',
    },
    dietitianAvatar: {
        width: '100%',
        height: '100%',
    },
    dietitianSummary: {
        flex: 1,
    },
    dietitianLabel: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    dietitianName: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '700',
    },
    dietitianLoadingText: {
        marginLeft: 10,
        color: '#6B7280',
        fontSize: 13,
    },
    dietitianDetails: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    dietitianDetailRow: {
        marginBottom: 10,
    },
    dietitianDetailLabel: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 3,
    },
    dietitianDetailValue: {
        color: '#1F2937',
        fontSize: 14,
        lineHeight: 20,
    },
    dietitianEmptyDetail: {
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 20,
    },
    dietitianError: {
        color: '#B91C1C',
        fontSize: 13,
        marginTop: 4,
    },
    profileError: {
        color: '#B91C1C',
        fontSize: 13,
        marginTop: 10,
        paddingHorizontal: 20,
        textAlign: 'center',
    },
    modalSafeArea: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalKeyboardContainer: {
        flex: 1,
    },
    avatarPreviewOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    avatarPreviewContainer: {
        width: '100%',
        maxWidth: 420,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
    },
    avatarPreviewTitle: {
        alignSelf: 'flex-start',
        color: '#1F2937',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 18,
    },
    avatarPreviewImage: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: '#F3F4F6',
        borderWidth: 3,
        borderColor: '#DCFCE7',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    modalContainer: {
        width: '100%',
        maxWidth: 560,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1F2937',
    },
    inputLabel: {
        width: '100%',
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 4,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        color: '#1F2937',
        fontSize: 15,
    },
    multilineInput: {
        minHeight: 96,
        textAlignVertical: 'top',
    },
    fieldError: {
        width: '100%',
        color: '#B91C1C',
        fontSize: 13,
        marginTop: -8,
        marginBottom: 12,
    },
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#4B5563',
        fontWeight: '600',
    },
    saveButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        marginLeft: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        marginVertical: 8,
    },
    chip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    chipSelected: {
        backgroundColor: '#4CAF50',
    },
    chipText: {
        color: '#4B5563',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#fff',
    },
    addButton: {
        backgroundColor: '#E5E7EB',
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginLeft: 8,
    },
    addButtonText: {
        color: '#374151',
        fontWeight: '600',
    }
});

export default ProfileScreen;
