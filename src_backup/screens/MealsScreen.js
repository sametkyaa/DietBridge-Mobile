import React, { useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDayOptions, meals } from '../constants/dietData';
import { useMeals } from '../context/MealsContext';
import styles from '../theme/styles';

const getMealIconConfig = (type) => {
  const value = (type || '').toLowerCase();

  if (value.includes('kahvalt')) {
    return { name: 'sunny-outline', background: '#FEF3C7', color: '#F59E0B' };
  }
  if (value.includes('öğle')) {
    return { name: 'fast-food-outline', background: '#DBEAFE', color: '#1D4ED8' };
  }
  if (value.includes('akşam')) {
    return { name: 'moon-outline', background: '#EDE9FE', color: '#6D28D9' };
  }
  if (value.includes('ara')) {
    return { name: 'nutrition-outline', background: '#FFE4E6', color: '#DB2777' };
  }

  return { name: 'restaurant-outline', background: '#E6F4EC', color: '#15803D' };
};

const MealsScreen = () => {
  const dayOptions = useMemo(() => getDayOptions() ?? [], []);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [groceryModalVisible, setGroceryModalVisible] = useState(false);
  const [groceryItems, setGroceryItems] = useState([]);
  const [photoPreviewUri, setPhotoPreviewUri] = useState(null);
  const { completedMeals } = useMeals();

  // Request Modal State
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [requestSelectedDay, setRequestSelectedDay] = useState(0);
  const [requestSelectedMeals, setRequestSelectedMeals] = useState([]);
  const [requestMessage, setRequestMessage] = useState('');

  const handleOpenRequestModal = () => {
    setRequestSelectedDay(selectedDay);
    setRequestSelectedMeals([]);
    setRequestMessage('');
    setRequestModalVisible(true);
  };

  const handleToggleRequestMeal = (mealType) => {
    setRequestSelectedMeals((prev) => {
      if (prev.includes(mealType)) {
        return prev.filter((t) => t !== mealType);
      }
      return [...prev, mealType];
    });
  };

  const handleSendRequest = () => {
    if (requestSelectedMeals.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir öğün seçiniz.');
      return;
    }
    if (!requestMessage.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir mesaj veya talep yazınız.');
      return;
    }

    // Mock sending request
    Alert.alert('Başarılı', 'Öğün değişikliği talebiniz diyetisyeninize iletildi.');
    setRequestModalVisible(false);
  };

  const handleRequestDayChange = (index) => {
    if (requestSelectedMeals.length > 0 || requestMessage.trim().length > 0) {
      Alert.alert(
        'Tamamlanmamış Talep',
        'Başka bir güne geçmeden önce lütfen mevcut gün için talebinizi gönderin veya temizleyin.',
        [{ text: 'Tamam', style: 'cancel' }]
      );
      return;
    }
    setRequestSelectedDay(index);
  };

  const openMealModal = (meal) => setSelectedMeal(meal);
  const closeMealModal = () => setSelectedMeal(null);

  const openPhotoPreview = (uri) => setPhotoPreviewUri(uri);
  const closePhotoPreview = () => setPhotoPreviewUri(null);

  const buildGroceryItems = () => {
    const counts = {};
    meals.forEach((meal) => {
      meal.ingredients?.forEach((ingredient) => {
        const key = ingredient.trim();
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return Object.keys(counts).map((name) => ({ name, count: counts[name], checked: false }));
  };

  const handleGenerateGroceryList = () => {
    const items = buildGroceryItems();
    setGroceryItems(items);
    setGroceryModalVisible(true);
  };

  const toggleGroceryItem = (name) => {
    setGroceryItems((prev) =>
      prev.map((item) => (item.name === name ? { ...item, checked: !item.checked } : item)),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.mealsContainer}>
        <View style={styles.mealsHeader}>
          <Image source={require('../../assets/meal_icon.png')} style={{ width: 40, height: 40, marginRight: 12 }} resizeMode="contain" />
          <View>
            <Text style={styles.mealsTitle}>Haftalık Öğün Planınız</Text>
          </View>
          <TouchableOpacity style={[styles.groceryButton, { marginBottom: 0, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 50 }]} onPress={handleGenerateGroceryList}>
            <Ionicons name="cart-outline" size={24} color="#047857" />
          </TouchableOpacity>
        </View>


        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.dayScroll}
          contentContainerStyle={styles.daySelector}
        >
          {dayOptions.map((day, index) => {
            const selected = index === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayPill, selected && styles.dayPillSelected]}
                onPress={() => setSelectedDay(index)}
              >
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.mealsList} contentContainerStyle={styles.mealsListContent}>
          {meals.map((meal) => {
            const completion = completedMeals[meal.type];
            const isCompleted = !!completion?.completed;
            const photoUri = completion?.photoUri;
            const iconConfig = getMealIconConfig(meal.type);

            return (
              <TouchableOpacity
                key={`${meal.type}-${meal.time}`}
                activeOpacity={0.9}
                style={styles.mealCard}
                onPress={() => openMealModal(meal)}
              >
                <View style={styles.mealCardHeader}>
                  {photoUri ? (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => openPhotoPreview(photoUri)}
                      style={styles.mealPhotoThumbWrapper}
                    >
                      <Image source={{ uri: photoUri }} style={styles.mealPhotoThumb} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.mealIconCircle, { backgroundColor: iconConfig.background }]}>
                      <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                    </View>
                  )}
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealHeader}>
                      {meal.type} • {meal.time}
                    </Text>
                    <Text style={styles.mealDesc}>{meal.desc}</Text>
                    <Text style={styles.mealSubtleText}>Tarifi görüntüle</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
                {meal.note && (
                  <View style={styles.mealDetails}>
                    <Text style={styles.mealNote}>{meal.note}</Text>
                  </View>
                )}
                {isCompleted && (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={16} color="#2E7D32" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleOpenRequestModal}
        >
          <Text style={styles.requestButtonText}>Öğün Değişikliği Talep Et</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={!!selectedMeal}
        animationType="slide"
        transparent
        onRequestClose={closeMealModal}
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
                  <TouchableOpacity style={styles.mealModalCloseButton} onPress={closeMealModal}>
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
      <Modal
        visible={groceryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setGroceryModalVisible(false)}
      >
        <View style={styles.mealModalOverlay}>
          <View style={styles.mealModalCard}>
            <View style={styles.mealModalHeader}>
              <View>
                <Text style={styles.mealModalTitle}>Alışveriş Listesi</Text>
                <Text style={styles.mealModalSubtitle}>Haftalık plan</Text>
              </View>
              <TouchableOpacity
                style={styles.mealModalCloseButton}
                onPress={() => setGroceryModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#1F2A37" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.mealModalBody} showsVerticalScrollIndicator={false}>
              {groceryItems.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.groceryListRow}
                  onPress={() => toggleGroceryItem(item.name)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.checked ? 'checkbox-outline' : 'square-outline'}
                    size={20}
                    color={item.checked ? '#16A34A' : '#9CA3AF'}
                    style={styles.groceryCheckbox}
                  />
                  <Text
                    style={[styles.groceryListText, item.checked && styles.groceryListTextChecked]}
                  >
                    {item.name}
                    {item.count > 1 ? ` x${item.count}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={!!photoPreviewUri}
        animationType="fade"
        transparent
        onRequestClose={closePhotoPreview}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.photoModalOverlay}
          onPress={closePhotoPreview}
        >
          <View style={styles.photoModalBody}>
            {photoPreviewUri && (
              <Image source={{ uri: photoPreviewUri }} style={styles.photoModalImage} />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Meal Change Request Modal */}
      <Modal
        visible={requestModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRequestModalVisible(false)}
      >
        <View style={styles.mealModalOverlay}>
          <View style={styles.mealModalCard}>
            <View style={styles.mealModalHeader}>
              <View>
                <Text style={styles.mealModalTitle}>Öğün Değişikliği Talep Et</Text>
                <Text style={styles.mealModalSubtitle}>Değişiklik istediğiniz gün ve öğünleri seçin</Text>
              </View>
              <TouchableOpacity
                style={styles.mealModalCloseButton}
                onPress={() => setRequestModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#1F2A37" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.mealModalBody} showsVerticalScrollIndicator={false}>
              {/* Day Selection */}
              <Text style={styles.mealModalSectionTitle}>Gün Seçimi</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.dayScroll}
                contentContainerStyle={styles.daySelector}
              >
                {dayOptions.map((day, index) => {
                  const selected = index === requestSelectedDay;
                  return (
                    <TouchableOpacity
                      key={`req-${day}`}
                      style={[styles.dayPill, selected && styles.dayPillSelected]}
                      onPress={() => handleRequestDayChange(index)}
                    >
                      <Text style={[styles.dayText, selected && styles.dayTextSelected]}>{day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Meal Selection */}
              <Text style={styles.mealModalSectionTitle}>Öğün Seçimi</Text>
              <View style={styles.mealSelectionGrid}>
                {meals.map((meal) => {
                  const isSelected = requestSelectedMeals.includes(meal.type);
                  return (
                    <TouchableOpacity
                      key={`req-meal-${meal.type}`}
                      style={[styles.mealSelectionBtn, isSelected && styles.mealSelectionBtnActive]}
                      onPress={() => handleToggleRequestMeal(meal.type)}
                    >
                      <Text
                        style={[
                          styles.mealSelectionText,
                          isSelected && styles.mealSelectionTextActive,
                        ]}
                      >
                        {meal.type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Message Input */}
              <Text style={styles.mealModalSectionTitle}>Mesajınız</Text>
              <TextInput
                style={styles.requestInput}
                placeholder="Örn: Kahvaltıda yulaf yerine yumurta tercih ederim..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={requestMessage}
                onChangeText={setRequestMessage}
              />

              {/* Send Button */}
              <TouchableOpacity style={styles.sendButton} onPress={handleSendRequest}>
                <Text style={styles.sendButtonText}>Talebi Gönder</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MealsScreen;
