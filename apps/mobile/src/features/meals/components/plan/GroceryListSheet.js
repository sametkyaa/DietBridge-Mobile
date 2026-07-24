import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheetView, EmptyState, Icon } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

export function GroceryListSheet({ visible, items, onToggle, onClose, bottomInset }) {
    return (
        <BottomSheetView visible={visible} onClose={onClose} title="Alışveriş listesi" scrollable bottomInset={bottomInset}>
            <Text style={styles.supporting}>Seçili günün gerçek plan içeriğinden oluşturulur.</Text>
            {items.length === 0 ? (
                <EmptyState icon="cart" title="Liste oluşturulamadı" description="Bu günün planında alışveriş maddesi bulunmuyor." />
            ) : items.map((item) => (
                <Pressable
                    key={item.name}
                    onPress={() => onToggle(item.name)}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${item.name}${item.count > 1 ? `, ${item.count} adet` : ''}`}
                    accessibilityState={{ checked: item.checked }}
                    style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                >
                    <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                        {item.checked ? <Icon name="check" size={16} color={colors.white} /> : null}
                    </View>
                    <Text style={[styles.item, item.checked && styles.itemChecked]}>
                        {item.name}{item.count > 1 ? ` ×${item.count}` : ''}
                    </Text>
                </Pressable>
            ))}
        </BottomSheetView>
    );
}

const styles = StyleSheet.create({
    supporting: { ...typography.supporting, color: colors.textSecondary },
    row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
    checkbox: { width: 28, height: 28, borderRadius: radius.small, borderWidth: 1.5, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
    item: { ...typography.body, color: colors.textPrimary, flex: 1 },
    itemChecked: { color: colors.textSecondary, textDecorationLine: 'line-through' },
    pressed: { opacity: 0.8 },
});

export default GroceryListSheet;
