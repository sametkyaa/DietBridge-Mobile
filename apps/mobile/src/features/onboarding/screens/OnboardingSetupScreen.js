import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, ChoiceChip, ErrorState, Icon } from '../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { PlateMark } from '../../auth/components/BrandMark';
import { COMMON_FOOD_INTOLERANCES } from '../../clients/constants/profileOptions';
import OnboardingConnectStep from '../components/OnboardingConnectStep';
import OnboardingNumberField from '../components/OnboardingNumberField';
import OnboardingOptionCard from '../components/OnboardingOptionCard';
import OnboardingStepLayout from '../components/OnboardingStepLayout';
import HealthDataNotice from '../../../shared/components/legal/HealthDataNotice';
import { ONBOARDING_STEPS, useOnboardingSetupViewModel } from '../viewmodels/useOnboardingSetupViewModel';

const GOAL_STYLES = [
    { match: /ver|lose|azalt/i, icon: 'down', tone: 'primary' },
    { match: /al(ma|mak)|gain|kazan|artır/i, icon: 'up', tone: 'teal' },
    { match: /koru|maintain|sürdür/i, icon: 'minus', tone: 'accent' },
    { match: /sağlık|hastal|health|diyabet|tansiyon/i, icon: 'heartPulse', tone: 'error' },
];

const getGoalStyle = (goal) => {
    const text = `${goal.code || ''} ${goal.label || ''}`;
    return GOAL_STYLES.find((item) => item.match.test(text)) || { icon: 'target', tone: 'primary' };
};

function ChipGroup({ title, children }) {
    return (
        <View style={styles.chipGroup}>
            <Text style={styles.groupTitle}>{title}</Text>
            <View style={styles.chips}>{children}</View>
        </View>
    );
}

export default function OnboardingSetupScreen({ navigation, route, userId }) {
    const mode = route?.params?.mode === 'profile' ? 'profile' : 'initial';
    const handleExit = useCallback(() => {
        if (mode === 'profile' && navigation.canGoBack()) {
            navigation.goBack();
            return;
        }
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }, [mode, navigation]);
    const vm = useOnboardingSetupViewModel({ userId, mode, onExit: handleExit });
    const isConnectStep = vm.step === ONBOARDING_STEPS.CONNECT;
    const questionNumber = vm.steps.filter((item) => item !== ONBOARDING_STEPS.CONNECT).indexOf(vm.step) + 1;
    const questionCount = vm.steps.filter((item) => item !== ONBOARDING_STEPS.CONNECT).length;

    const header = (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                {vm.stepIndex > 0 ? (
                    <Pressable onPress={vm.back} hitSlop={8} accessibilityRole="button" accessibilityLabel="Önceki adım" style={styles.backButton}>
                        <Icon name="back" size={20} color={colors.textPrimary} />
                    </Pressable>
                ) : (
                    <View style={styles.brand}>
                        <PlateMark size={30} />
                        <Text style={styles.brandText}>DietBridge</Text>
                    </View>
                )}
                {mode === 'initial' ? (
                    <AppButton label={isConnectStep ? 'Sonra' : 'Atla'} variant="text" onPress={vm.skip} disabled={vm.isSaving} />
                ) : (
                    <AppButton label="Kapat" variant="text" onPress={handleExit} disabled={vm.isSaving} />
                )}
            </View>
            <View style={styles.progress} accessibilityLabel={`Adım ${vm.stepIndex + 1} / ${vm.steps.length}`}>
                {vm.steps.map((item, index) => (
                    <View key={item} style={[styles.progressSegment, index <= vm.stepIndex && styles.progressActive]} />
                ))}
            </View>
        </View>
    );

    const renderQuestion = () => {
        if (vm.loadStatus === 'loading') {
            return <View style={styles.centered}><ActivityIndicator color={colors.primaryDark} /></View>;
        }
        if (vm.loadStatus === 'error') {
            return (
                <View style={styles.centered}>
                    <ErrorState title="Bilgiler yüklenemedi" description="Bağlantını kontrol edip tekrar dene." onRetry={vm.retryLoad} />
                </View>
            );
        }

        const footer = <AppButton label={vm.isLastStep ? 'Bitir' : 'Devam'} onPress={vm.next} loading={vm.isSaving} />;
        const eyebrow = `Soru ${questionNumber} / ${questionCount}`;

        if (vm.step === ONBOARDING_STEPS.GOAL) {
            return (
                <OnboardingStepLayout stepKey="goal" title="Seni en iyi ne anlatır?" description={`${eyebrow} · Diyetisyenin planını buna göre şekillendirecek.`} error={vm.error} footer={footer}>
                    <HealthDataNotice />
                    <View style={styles.options} accessibilityRole="radiogroup">
                        {vm.referenceData.clientGoals.map((goal) => {
                            const goalStyle = getGoalStyle(goal);
                            return (
                                <OnboardingOptionCard
                                    key={String(goal.id)}
                                    label={goal.label}
                                    icon={goalStyle.icon}
                                    tone={goalStyle.tone}
                                    selected={String(vm.form.goalId) === String(goal.id)}
                                    onPress={() => vm.setField('goalId', goal.id)}
                                />
                            );
                        })}
                    </View>
                </OnboardingStepLayout>
            );
        }

        if (vm.step === ONBOARDING_STEPS.BODY) {
            const difference = vm.weightDifference;
            return (
                <OnboardingStepLayout stepKey="body" title="Ölçülerin" description={`${eyebrow} · İlk kilo kaydın Analiz ekranındaki grafiğin başlangıcı olur.`} error={vm.error} footer={footer}>
                    <OnboardingNumberField label="Boy" unit="cm" value={vm.form.heightCm} onChange={(value) => vm.setField('heightCm', value)} min={50} max={250} fallback={165} placeholder="165" />
                    <OnboardingNumberField label="Güncel kilo" unit="kg" value={vm.form.currentWeight} onChange={(value) => vm.setField('currentWeight', value)} step={0.1} decimals={1} min={20} max={500} fallback={70} placeholder="70" />
                    <OnboardingNumberField label="Hedef kilo" unit="kg" value={vm.form.targetWeight} onChange={(value) => vm.setField('targetWeight', value)} step={0.5} decimals={1} min={20} max={500} fallback={65} placeholder="65" />
                    {difference !== null ? (
                        <View style={styles.note}>
                            <Text style={styles.noteText}>
                                {difference > 0
                                    ? `${String(difference).replace('.', ',')} kg vermek istiyorsun. Diyetisyeninle birlikte adım adım ilerleyeceksin.`
                                    : `${String(Math.abs(difference)).replace('.', ',')} kg almak istiyorsun. Diyetisyeninle birlikte adım adım ilerleyeceksin.`}
                            </Text>
                        </View>
                    ) : null}
                </OnboardingStepLayout>
            );
        }

        return (
            <OnboardingStepLayout stepKey="preferences" title="Beslenme tercihlerin" description={`${eyebrow} · Bilmediğin ya da emin olmadığın yerleri boş bırakabilirsin.`} error={vm.error} footer={footer}>
                {vm.referenceData.nutritionTypes.length > 0 ? (
                    <ChipGroup title="Beslenme tipi">
                        {vm.referenceData.nutritionTypes.map((item) => (
                            <ChoiceChip
                                key={String(item.id)}
                                label={item.label}
                                selected={String(vm.form.nutritionTypeId) === String(item.id)}
                                onPress={() => vm.setField('nutritionTypeId', String(vm.form.nutritionTypeId) === String(item.id) ? null : item.id)}
                            />
                        ))}
                    </ChipGroup>
                ) : null}
                <ChipGroup title="Besin intoleransı (varsa)">
                    {COMMON_FOOD_INTOLERANCES.map((item) => (
                        <ChoiceChip
                            key={item}
                            label={item}
                            selected={vm.form.foodIntolerances.some((value) => value.toLocaleLowerCase('tr-TR') === item.toLocaleLowerCase('tr-TR'))}
                            onPress={() => vm.toggleIntolerance(item)}
                        />
                    ))}
                </ChipGroup>
                {vm.referenceData.activityLevels.length > 0 ? (
                    <ChipGroup title="Günlük hareket">
                        {vm.referenceData.activityLevels.map((item) => (
                            <ChoiceChip
                                key={String(item.id)}
                                label={item.label}
                                selected={String(vm.form.activityLevelId) === String(item.id)}
                                onPress={() => vm.setField('activityLevelId', String(vm.form.activityLevelId) === String(item.id) ? null : item.id)}
                            />
                        ))}
                    </ChipGroup>
                ) : null}
            </OnboardingStepLayout>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
            {header}
            {isConnectStep ? <OnboardingConnectStep userId={userId} onContinue={vm.skip} /> : renderQuestion()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.x5, paddingTop: spacing.x2, gap: spacing.x3 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.x2 },
    brandText: { ...typography.bodyMedium, fontFamily: typography.button.fontFamily, color: colors.primaryDark },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: radius.round,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progress: { flexDirection: 'row', gap: spacing.x1 },
    progressSegment: { flex: 1, height: 4, borderRadius: radius.round, backgroundColor: colors.borderStrong },
    progressActive: { backgroundColor: colors.primaryDark },
    centered: { flex: 1, justifyContent: 'center', padding: spacing.x5 },
    options: { gap: spacing.x3 },
    chipGroup: { gap: spacing.x2, marginBottom: spacing.x2 },
    groupTitle: { ...typography.caption, color: colors.textTertiary },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.x2 },
    note: { backgroundColor: colors.accentSoft, borderRadius: radius.control, paddingHorizontal: spacing.x4, paddingVertical: spacing.x3 },
    noteText: { ...typography.supporting, fontFamily: typography.bodyMedium.fontFamily, color: colors.accentDark },
});
