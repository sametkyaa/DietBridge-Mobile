import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FadeUp } from '../../../shared/components/motion';
import { InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';

// Shared frame for every setup step: title block, scrolling body and a pinned footer.
function OnboardingStepLayout({ stepKey, title, description, error, footer, children }) {
    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <FadeUp key={stepKey} style={styles.body}>
                    <View style={styles.heading}>
                        <Text style={styles.title} accessibilityRole="header">{title}</Text>
                        {description ? <Text style={styles.description}>{description}</Text> : null}
                    </View>
                    {children}
                </FadeUp>
            </ScrollView>
            <View style={styles.footer}>
                {error ? <InlineAlert variant="error" message={error} /> : null}
                {footer}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { paddingHorizontal: spacing.x5, paddingTop: spacing.x5, paddingBottom: spacing.x6 },
    body: { gap: spacing.x3 },
    heading: { gap: spacing.x2, marginBottom: spacing.x2 },
    title: { ...typography.screenTitle, color: colors.textPrimary },
    description: { ...typography.body, color: colors.textSecondary },
    footer: { paddingHorizontal: spacing.x5, paddingTop: spacing.x2, paddingBottom: spacing.x4, gap: spacing.x2 },
});

export default OnboardingStepLayout;
