import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, Modal, StyleSheet, TouchableWithoutFeedback, Dimensions, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { macros, meals } from '../constants/dietData';
import NutritionSummaryCard from '../components/NutritionSummaryCard';
import { useMeals } from '../context/MealsContext';
import styles from '../theme/styles';
import supabase from '../../lib/supabase';

const HomeScreen = () => {
  const { completedMeals, toggleMealCompletion } = useMeals();
  const [water, setWater] = useState(1.5);
  const [waterInput, setWaterInput] = useState('200');
  const [focusedMealType, setFocusedMealType] = useState(null);
  const [userName, setUserName] = useState('Kullanıcı');
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [dailyQuote, setDailyQuote] = useState('');
  const navigation = useNavigation();

  const quotes = [
    "Bugün harika bir gün olacak!",
    "Sağlıklı beslen, iyi hisset.",
    "Her adım seni hedefine yaklaştırır.",
    "Kendine inan, başarabilirsin.",
    "Su içmeyi unutma!",
    "Vücudun senin tapınağın, ona iyi bak.",
    "Disiplin, hedeflerle başarı arasındaki köprüdür.",
  ];

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setDailyQuote(quotes[randomIndex]);
  }, []);
  const waterProgress = Math.min(water / 3, 1);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        const firstName = user.user_metadata.full_name.split(' ')[0];
        setUserName(firstName);
      }
    };
    getUser();
  }, []);

  const firstIncompleteMeal = useMemo(
    () => meals.find((meal) => !completedMeals[meal.type]?.completed),
    [completedMeals],
  );
  const displayedMeal =
    (focusedMealType && meals.find((meal) => meal.type === focusedMealType)) || firstIncompleteMeal;
  const isMealCompleted = displayedMeal ? !!completedMeals[displayedMeal.type]?.completed : false;

  const addWater = () => {
    const amount = parseInt(waterInput, 10) || 200;
    setWater((prev) => Math.min(prev + amount / 1000, 5)); // Max 5L for safety
  };

  const removeWater = () => {
    const amount = parseInt(waterInput, 10) || 200;
    setWater((prev) => Math.max(prev - amount / 1000, 0));
  };

  const completeMeal = (photoUri = null) => {
    if (!displayedMeal) return;
    toggleMealCompletion(displayedMeal.type, photoUri);
    setFocusedMealType(displayedMeal.type);
  };

  const handleAddPhoto = async (source) => {
    if (!displayedMeal) return;
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
        completeMeal(uri);
      }
    } catch (error) {
      console.warn('Fotoğraf ekleme hatası', error);
      Alert.alert('Fotoğraf eklenemedi', 'Lütfen tekrar deneyin.');
    }
  };

  const promptForPhoto = () => {
    if (!displayedMeal) return;
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

  const handleToggleMealCompletion = () => {
    if (!displayedMeal) return;
    if (isMealCompleted) {
      toggleMealCompletion(displayedMeal.type);
      setFocusedMealType(null);
      return;
    }
    promptForPhoto();
  };

  const handleGoToNextMeal = () => {
    if (firstIncompleteMeal) {
      setFocusedMealType(firstIncompleteMeal.type);
    } else {
      setFocusedMealType(null);
    }
  };

  const buttonLabel = displayedMeal ? (isMealCompleted ? 'Geri Al' : 'Öğünü Yedim') : 'Tamamlandı';
  const isButtonDisabled = !displayedMeal;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setIsSidebarVisible(true)}>
            <View style={styles.avatar} />
          </TouchableOpacity>
          <Text style={styles.greeting}>Günaydın, {userName}!</Text>
          <Text style={styles.bell}>🔔</Text>
        </View>

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

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Sıradaki Öğün</Text>
            {displayedMeal && (
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
                  <Text style={styles.mealTitle}>{displayedMeal.type}</Text>
                  <Text style={styles.mealDesc}>{displayedMeal.desc}</Text>
                  <Text style={styles.mealTimeText}>{displayedMeal.time}</Text>
                </>
              ) : (
                <Text style={styles.mealDesc}>Bugünün tüm öğünleri tamamlandı.</Text>
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
                  <View style={localStyles.sidebarAvatar} />
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

      <Modal
        visible={!!selectedMeal}
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
                    <Text style={styles.mealModalTitle}>{selectedMeal.type}</Text>
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

const { height } = Dimensions.get('window');

const localStyles = StyleSheet.create({
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

export default HomeScreen;
