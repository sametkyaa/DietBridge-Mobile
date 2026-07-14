import React from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    TextInput,
    Dimensions,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { macros } from '../../../config/dietData';
import NutritionSummaryCard from '../../clients/components/NutritionSummaryCard';
import { styles } from '../../../shared/theme/styles';
import { useDashboardViewModel } from '../viewmodels/useDashboardViewModel';

const DashboardScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const screenBottomPadding = 64 + insets.bottom + insets.bottom + 16;
    const {
        water,
        waterInput,
        setWaterInput,
        userName,
        greeting,
        avatarUrl,
        isSidebarVisible,
        setIsSidebarVisible,
        selectedMeal,
        setSelectedMeal,
        dailyQuote,
        waterProgress,
        meals,
        displayedMeal,
        isMealCompleted,
        addWater,
        removeWater,
        completeMeal,
        handleGoToNextMeal,
        firstIncompleteMeal,
        weight,
        weightInput,
        setWeightInput,
        handleSaveWeight,
        activeDietitian,
        pendingRequest,
        hasActiveDietitian,
        isLoadingConnection,
        connectionAction,
        connectionError,
        connectionRequiredMessage,
        handleApproveDietitianRequest,
        handleRejectDietitianRequest,
    } = useDashboardViewModel();

    const handleAddPhoto = async (source) => {
        if (!displayedMeal || !hasActiveDietitian) return;
        try {
            const pickers = {
                camera: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('İzin gerekli', 'Kamera izni verilmedi.');
                        return null;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        quality: 0.7,
                    });
                    if (result.canceled) return null;
                    return result.assets?.[0]?.uri || null;
                },
                gallery: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('İzin gerekli', 'Galeri izni verilmedi.');
                        return null;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        quality: 0.8,
                    });
                    if (result.canceled) return null;
                    return result.assets?.[0]?.uri || null;
                },
            };

            const uri = await pickers[source]?.();
            if (uri) {
                await completeMeal(uri);
            }
        } catch (error) {
            console.warn('Fotoğraf ekleme hatası', error);
            Alert.alert('Fotoğraf eklenemedi', 'Lütfen tekrar deneyin.');
        }
    };

    const promptForPhoto = () => {
        if (!displayedMeal || !hasActiveDietitian) return;
        Alert.alert('Fotoğraf eklemek ister misiniz?', 'Öğün fotoğrafını ekleyebilirsiniz.', [
            { text: 'Fotoğraf çek', onPress: () => handleAddPhoto('camera') },
            { text: 'Galeriden seç', onPress: () => handleAddPhoto('gallery') },
            {
                text: 'Hayır, sadece işaretle',
                style: 'cancel',
                onPress: () => completeMeal(),
            },
        ]);
    };

    const handleToggleMealCompletion = async () => {
        if (!hasActiveDietitian) {
            Alert.alert('Bilgi', connectionRequiredMessage);
            return;
        }
        if (!displayedMeal) return;
        if (isMealCompleted) {
            await completeMeal();
            return;
        }
        promptForPhoto();
    };

    const renderDietitianInfo = (dietitian) => {
        if (!dietitian) return null;

        const details = [
            dietitian.specialization ? `Uzmanlık: ${dietitian.specialization}` : null,
            dietitian.university ? `Okul: ${dietitian.university}` : null,
            dietitian.experienceYears !== null && dietitian.experienceYears !== undefined
                ? `Deneyim: ${dietitian.experienceYears} yıl`
                : null,
            dietitian.bio || null,
        ].filter(Boolean);

        return (
            <View style={localStyles.dietitianInfo}>
                <Text style={localStyles.dietitianName}>{dietitian.name}</Text>
                {!!dietitian.email && <Text style={localStyles.dietitianEmail}>{dietitian.email}</Text>}
                {details.map((detail) => (
                    <Text key={detail} style={localStyles.dietitianDetail}>{detail}</Text>
                ))}
            </View>
        );
    };

    const renderConnectionCard = () => {
        const actionInProgress = !!connectionAction;

        if (isLoadingConnection && !pendingRequest && !activeDietitian) {
            return (
                <View style={styles.card}>
                    <View style={localStyles.connectionLoading}>
                        <ActivityIndicator size="small" color="#4CAF50" />
                        <Text style={localStyles.connectionLoadingText}>Bağlantı durumu kontrol ediliyor...</Text>
                    </View>
                </View>
            );
        }

        if (pendingRequest) {
            return (
                <View style={styles.card}>
                    <View style={localStyles.connectionHeader}>
                        <View style={localStyles.connectionIcon}>
                            <Ionicons name="person-add-outline" size={20} color="#047857" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={localStyles.connectionTitle}>Diyetisyen Bağlantı İsteği</Text>
                            <Text style={localStyles.connectionDescription}>Bir diyetisyen sizinle çalışmak istiyor.</Text>
                        </View>
                    </View>
                    {renderDietitianInfo(pendingRequest.dietitian)}
                    {!!connectionError && <Text style={localStyles.connectionError}>{connectionError}</Text>}
                    <View style={localStyles.connectionActions}>
                        <TouchableOpacity
                            style={[localStyles.rejectButton, actionInProgress && localStyles.disabledAction]}
                            onPress={handleRejectDietitianRequest}
                            disabled={actionInProgress}
                        >
                            <Text style={localStyles.rejectButtonText}>Reddet</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[localStyles.approveButton, actionInProgress && localStyles.disabledAction]}
                            onPress={handleApproveDietitianRequest}
                            disabled={actionInProgress}
                        >
                            {connectionAction === 'approve' ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={localStyles.approveButtonText}>Onayla</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return null;
    };

    const buttonLabel = displayedMeal ? (isMealCompleted ? 'Geri Al' : 'Öğünü Yedim') : 'Tamamlandı';
    const emptyMealPlanMessage = hasActiveDietitian
        ? 'Bugün için henüz öğün planı bulunmuyor. Diyetisyeniniz plan eklediğinde burada görünecek.'
        : connectionRequiredMessage;
    const isButtonDisabled = !displayedMeal || !hasActiveDietitian;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 0, paddingBottom: screenBottomPadding }]}>
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setIsSidebarVisible(true)}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.greeting}>{greeting}, {userName}!</Text>
                    <Text style={styles.bell}>🔔</Text>
                </View>

                {hasActiveDietitian && (
                    <NutritionSummaryCard
                        caloriesConsumed={1050}
                        caloriesTarget={1800}
                        steps={4150}
                        macros={{
                            carbs: { value: macros[0].current, target: macros[0].target, unit: 'g' },
                            protein: { value: macros[1].current, target: macros[1].target, unit: 'g' },
                            fat: { value: macros[2].current, target: macros[2].target, unit: 'g' },
                        }}
                    />
                )}

                {renderConnectionCard()}

                <View style={styles.card}>
                    <View style={styles.waterHeader}>
                        <Text style={styles.sectionTitle}>Su</Text>
                    </View>
                    <View style={styles.waterRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.waterAmount}>{water.toFixed(2)} L</Text>
                            <View style={styles.progressBackground}>
                                <View style={[styles.waterProgressFill, { width: `${waterProgress * 100}%` }]} />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={[styles.waterCupButton, { marginRight: 8 }]} onPress={removeWater}>
                                <Ionicons name="remove-outline" size={26} color="#3B82F6" />
                            </TouchableOpacity>
                            <View style={localStyles.waterInputContainer}>
                                <TextInput
                                    style={localStyles.waterInput}
                                    value={waterInput}
                                    onChangeText={setWaterInput}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                                <Text style={localStyles.waterUnit}>ml</Text>
                            </View>
                            <TouchableOpacity style={[styles.waterCupButton, { marginLeft: 8 }]} onPress={addWater}>
                                <Ionicons name="add-outline" size={26} color="#3B82F6" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Günlük Kilo Takibi */}
                <View style={[styles.card, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View>
                        <Text style={styles.sectionTitle}>Güncel Kilonuz</Text>
                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                            {weight ? `Son kaydedilen: ${weight} kg` : 'Henüz kilonuzu girmediniz.'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={localStyles.waterInputContainer}>
                            <TextInput
                                style={localStyles.waterInput}
                                value={weightInput}
                                onChangeText={setWeightInput}
                                keyboardType="numeric"
                                maxLength={5}
                                placeholder="0.0"
                            />
                            <Text style={localStyles.waterUnit}>kg</Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.waterCupButton, { marginLeft: 8, backgroundColor: '#10B981' }]} 
                            onPress={handleSaveWeight}
                        >
                            <Ionicons name="checkmark-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Sıradaki Öğün</Text>
                        {displayedMeal && hasActiveDietitian && (
                            <TouchableOpacity onPress={() => setSelectedMeal(displayedMeal)}>
                                <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '500' }}>Detay</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.nextMeal}>
                        <View style={styles.mealIconPlaceholder}>
                            <Text style={styles.mealEmoji}>🍽️</Text>
                        </View>
                        <View>
                            {displayedMeal ? (
                                <>
                                    <Text style={styles.mealTitle}>{displayedMeal.title || displayedMeal.type}</Text>
                                    <Text style={styles.mealDesc}>{displayedMeal.desc}</Text>
                                    <Text style={styles.mealTimeText}>{displayedMeal.time}</Text>
                                </>
                            ) : (
                                <Text style={styles.mealDesc}>
                                    {meals.length === 0 ? emptyMealPlanMessage : 'Bugünün tüm öğünleri tamamlandı.'}
                                </Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.nextMealActions}>
                        <TouchableOpacity
                            onPress={handleToggleMealCompletion}
                            disabled={isButtonDisabled}
                            style={[
                                styles.eatButton,
                                isButtonDisabled && styles.eatButtonDisabled,
                                !isButtonDisabled && isMealCompleted && styles.eatButtonCompleted,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.eatButtonText,
                                    (isButtonDisabled || isMealCompleted) && styles.eatButtonTextCompleted,
                                ]}
                            >
                                {buttonLabel}
                            </Text>
                        </TouchableOpacity>
                        {isMealCompleted && firstIncompleteMeal && firstIncompleteMeal.type !== displayedMeal.type && (
                            <TouchableOpacity style={styles.nextMealLink} onPress={handleGoToNextMeal}>
                                <Text style={styles.nextMealLinkText}>Sonraki öğüne geç</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Günün Motivasyonu</Text>
                    <Text style={{ fontSize: 16, fontStyle: 'italic', color: '#4B5563', textAlign: 'center', marginTop: 8 }}>
                        "{dailyQuote}"
                    </Text>
                </View>
            </ScrollView>

            {/* Sidebar Modal */}
            <Modal
                visible={isSidebarVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsSidebarVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsSidebarVisible(false)}>
                    <View style={localStyles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={localStyles.sidebar}>
                                <View style={localStyles.sidebarHeader}>
                                    {avatarUrl ? (
                                        <Image source={{ uri: avatarUrl }} style={localStyles.sidebarAvatar} />
                                    ) : (
                                        <View style={localStyles.sidebarAvatar} />
                                    )}
                                    <Text style={localStyles.sidebarName}>{userName}</Text>
                                </View>

                                <TouchableOpacity
                                    style={localStyles.menuItem}
                                    onPress={() => {
                                        setIsSidebarVisible(false);
                                        navigation.navigate('Profile');
                                    }}
                                >
                                    <Ionicons name="person-outline" size={24} color="#333" />
                                    <Text style={localStyles.menuText}>Profil</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={localStyles.menuItem}
                                    onPress={() => {
                                        setIsSidebarVisible(false);
                                        navigation.navigate('Settings');
                                    }}
                                >
                                    <Ionicons name="settings-outline" size={24} color="#333" />
                                    <Text style={localStyles.menuText}>Ayarlar</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={localStyles.menuItem}
                                    onPress={() => {
                                        setIsSidebarVisible(false);
                                        navigation.navigate('Support');
                                    }}
                                >
                                    <Ionicons name="help-circle-outline" size={24} color="#333" />
                                    <Text style={localStyles.menuText}>Destek</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Meal Detail Modal */}
            <Modal
                visible={!!selectedMeal && hasActiveDietitian}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedMeal(null)}
            >
                <View style={styles.mealModalOverlay}>
                    <View style={styles.mealModalCard}>
                        {selectedMeal && (
                            <>
                                <View style={styles.mealModalHeader}>
                                    <View>
                                        <Text style={styles.mealModalTitle}>{selectedMeal.title || selectedMeal.type}</Text>
                                        <Text style={styles.mealModalSubtitle}>{selectedMeal.time}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.mealModalCloseButton} onPress={() => setSelectedMeal(null)}>
                                        <Ionicons name="close" size={20} color="#1F2A37" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.mealModalDesc}>{selectedMeal.desc}</Text>
                                {selectedMeal.note && <Text style={styles.mealModalNote}>{selectedMeal.note}</Text>}
                                <ScrollView style={styles.mealModalBody} showsVerticalScrollIndicator={false}>
                                    <Text style={styles.mealModalSectionTitle}>Malzemeler</Text>
                                    {selectedMeal.ingredients?.map((item) => (
                                        <View key={item} style={styles.mealModalListRow}>
                                            <View style={styles.mealModalBullet} />
                                            <Text style={styles.mealModalListText}>{item}</Text>
                                        </View>
                                    ))}
                                    <Text style={styles.mealModalSectionTitle}>Hazırlanış</Text>
                                    {selectedMeal.steps?.map((step, index) => (
                                        <View key={`${step}-${index}`} style={styles.mealModalStepRow}>
                                            <View style={styles.mealModalStepIndex}>
                                                <Text style={styles.mealModalStepIndexText}>{index + 1}</Text>
                                            </View>
                                            <Text style={styles.mealModalListText}>{step}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const localStyles = StyleSheet.create({
    connectionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    connectionIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#ECFDF5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    connectionIconMuted: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    connectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    connectionDescription: {
        marginTop: 3,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    connectionLoading: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    connectionLoadingText: {
        marginLeft: 10,
        color: '#6B7280',
        fontSize: 13,
    },
    dietitianInfo: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        marginTop: 4,
    },
    dietitianName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },
    dietitianEmail: {
        marginTop: 4,
        fontSize: 13,
        color: '#4B5563',
    },
    dietitianDetail: {
        marginTop: 6,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    connectionError: {
        marginTop: 10,
        color: '#B91C1C',
        fontSize: 13,
        lineHeight: 18,
    },
    connectionActions: {
        flexDirection: 'row',
        marginTop: 14,
    },
    approveButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    approveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    rejectButton: {
        flex: 1,
        minHeight: 44,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    rejectButtonText: {
        color: '#374151',
        fontSize: 15,
        fontWeight: '700',
    },
    disabledAction: {
        opacity: 0.55,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-start',
    },
    sidebar: {
        width: '70%',
        height: '100%',
        backgroundColor: '#fff',
        padding: 20,
        paddingTop: 60,
        shadowColor: '#000',
        shadowOffset: {
            width: 2,
            height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sidebarHeader: {
        marginBottom: 40,
        alignItems: 'center',
    },
    sidebarAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0E0E0',
        marginBottom: 10,
    },
    sidebarName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuText: {
        fontSize: 16,
        marginLeft: 15,
        color: '#333',
    },
    waterInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        width: 80,
        justifyContent: 'center',
    },
    waterInput: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
        minWidth: 30,
    },
    waterUnit: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 2,
    },
});

export default DashboardScreen;
