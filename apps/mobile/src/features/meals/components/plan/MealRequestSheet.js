import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton, AppInput, BottomSheetView, ChoiceChip } from '../../../../shared/components/ui';
import { colors, spacing, typography } from '../../../../shared/theme';

export function MealRequestSheet({
    visible,
    dayOptions,
    selectedDay,
    selectedMeals,
    meals,
    message,
    onDayChange,
    onToggleMeal,
    onMessageChange,
    onSend,
    onClose,
    isSending,
    bottomInset,
}) {
    const handleClose = () => {
        if (!isSending) onClose();
    };

    return (
        <BottomSheetView
            visible={visible}
            onClose={handleClose}
            title="Öğün değişikliği talebi"
            scrollable
            bottomInset={bottomInset}
            footer={<AppButton label="Talebi gönder" onPress={onSend} loading={isSending} disabled={isSending} />}
        >
            <Text style={styles.supporting}>Değişiklik istediğiniz gün ve mevcut plandaki öğünleri seçin.</Text>
            <Text style={styles.label} accessibilityRole="header">Gün seçimi</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {dayOptions.map((day, index) => (
                    <ChoiceChip
                        key={`request-${index}-${day}`}
                        label={day}
                        selected={selectedDay === index}
                        onPress={() => onDayChange(index)}
                        disabled={isSending}
                    />
                ))}
            </ScrollView>
            <Text style={styles.label} accessibilityRole="header">Öğün seçimi</Text>
            <View style={styles.chips}>
                {meals.map((meal) => (
                    <ChoiceChip
                        key={`request-meal-${meal.type}`}
                        label={meal.title || meal.type}
                        selected={selectedMeals.includes(meal.type)}
                        onPress={() => onToggleMeal(meal.type)}
                        disabled={isSending}
                    />
                ))}
            </View>
            {meals.length === 0 ? <Text style={styles.supporting}>Seçilebilecek öğün bulunmuyor.</Text> : null}
            <Text style={styles.label} accessibilityRole="header">Mesajınız</Text>
            <AppInput
                value={message}
                onChangeText={onMessageChange}
                placeholder="Örn: Kahvaltıda yulaf yerine yumurta tercih ederim..."
                multiline
                numberOfLines={4}
                editable={!isSending}
                accessibilityLabel="Değişiklik talebi mesajı"
                inputStyle={styles.input}
            />
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    supporting: { ...typography.supporting, color: colors.textSecondary },
    label: { ...typography.bodyMedium, color: colors.textPrimary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
    input: { minHeight: 104, textAlignVertical: 'top' },
});

export default MealRequestSheet;
