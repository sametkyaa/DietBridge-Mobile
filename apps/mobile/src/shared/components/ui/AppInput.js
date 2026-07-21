import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export function AppInput({
  label,
  value,
  placeholder,
  error,
  hint,
  secureTextEntry = false,
  keyboardType,
  onChangeText,
  onBlur,
  onFocus,
  editable = true,
  rightAccessory = null,
  style,
  inputStyle,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
  placeholderTextColor = colors.textTertiary,
  multiline = false,
  ...textInputProps
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.root, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputWrapFocused,
          !!error && styles.inputWrapError,
          !editable && styles.inputWrapDisabled,
        ]}
      >
        <TextInput
          value={value}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          editable={editable}
          multiline={multiline}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint || error || hint}
          accessibilityState={{
            ...accessibilityState,
            disabled: !editable || accessibilityState?.disabled,
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, multiline && styles.inputMultiline, inputStyle]}
          {...textInputProps}
        />
        {rightAccessory}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.x2 },
  label: { ...typography.supporting, fontFamily: typography.bodyMedium.fontFamily, color: colors.textPrimary },
  inputWrap: {
    minHeight: 52,
    borderRadius: radius.control,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.x4,
  },
  inputWrapFocused: { borderColor: colors.primary, borderWidth: 1.5 },
  inputWrapError: { borderColor: colors.error },
  inputWrapDisabled: { backgroundColor: colors.surfaceMuted },
  input: {
    flex: 1,
    paddingVertical: spacing.x3,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  error: { ...typography.supporting, color: colors.errorDark },
  hint: { ...typography.supporting, color: colors.textSecondary },
});

export default AppInput;
