import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppSkeleton, ErrorState, InlineAlert } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import {
    BadgesCard,
    BodyMeasurementsCard,
    MeasurementHistorySheet,
    MeasurementSheet,
    WaterHistoryCard,
    WeightProgressCard,
    WeightEntrySheet,
} from '../components';
import { useAnalyticsViewModel } from '../viewmodels/useAnalyticsViewModel';

function LoadingView({ retrying }) {
    return (
        <View
            style={screenStyles.loadingWrap}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={retrying ? 'Analiz verileri yeniden yükleniyor' : 'Analiz verileri yükleniyor'}
            accessibilityState={{ busy: true }}
        >
            <AppSkeleton width="55%" height={28} animated />
            <AppSkeleton height={140} animated style={screenStyles.skeletonGap} />
            <AppSkeleton height={120} animated style={screenStyles.skeletonGap} />
            <Text style={screenStyles.loadingText}>{retrying ? 'Veriler yeniden yükleniyor...' : 'Veriler yükleniyor...'}</Text>
        </View>
    );
}

const AnalysisScreen = () => {
    const insets = useSafeAreaInsets();
    const {
        weeklyWeightData,
        selectedWeekIndex,
        setSelectedWeekIndex,
        maxChangeMagnitude,
        measurements,
        waterHistory,
        badges,
        monthLabel,
        currentWeight,
        startWeight,
        weightChange,
        totalWater,
        analyticsStatus,
        analyticsError,
        retryAnalytics,
        isEditingMeasurements,
        handleEditMeasurementsToggle,
        measurementForm,
        setMeasurementForm,
        handleSaveMeasurements,
        isSavingMeasurements,
        measurementHistory,
        measurementHistoryStatus,
        isMeasurementHistoryVisible,
        handleOpenMeasurementHistory,
        handleCloseMeasurementHistory,
        isAddingWeight,
        weightInput,
        setWeightInput,
        isSavingWeight,
        handleOpenWeightEntry,
        handleCloseWeightEntry,
        handleSaveWeight,
        hasActiveDietitian,
        isLoadingConnection,
        connectionError,
        connectionRequiredMessage,
    } = useAnalyticsViewModel();

    const loading = isLoadingConnection || analyticsStatus === 'loading' || analyticsStatus === 'retrying';

    if (loading) {
        return (
            <SafeAreaView style={screenStyles.safeArea} edges={['top', 'left', 'right']}>
                <LoadingView retrying={analyticsStatus === 'retrying'} />
            </SafeAreaView>
        );
    }

    if (!hasActiveDietitian || analyticsStatus === 'locked') {
        return (
            <SafeAreaView style={screenStyles.safeArea} edges={['top', 'left', 'right']}>
                <View style={screenStyles.centered}>
                    <InlineAlert variant="warning" title="Analizler kilitli" message={connectionRequiredMessage} />
                    {connectionError ? <InlineAlert variant="error" message={connectionError} style={screenStyles.alertGap} /> : null}
                </View>
            </SafeAreaView>
        );
    }

    if (analyticsStatus === 'error') {
        return (
            <SafeAreaView style={screenStyles.safeArea} edges={['top', 'left', 'right']}>
                <View style={screenStyles.centered}>
                    <AppCard>
                        <ErrorState title="Analizler yüklenemedi" description={analyticsError} onRetry={retryAnalytics} />
                    </AppCard>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={screenStyles.safeArea} edges={['top', 'left', 'right']}>
            <ScrollView contentContainerStyle={screenStyles.content} showsVerticalScrollIndicator={false}>
                <View>
                    <Text style={screenStyles.title} accessibilityRole="header">İlerleme analizi</Text>
                    <Text style={screenStyles.subtitle}>Gerçek kayıtlarınızın güncel özeti</Text>
                </View>
                {analyticsStatus === 'empty' ? (
                    <InlineAlert variant="info" title="Henüz analiz verisi yok" message="Kilo, ölçüm ve su kayıtlarınız eklendikçe ilerlemeniz burada görünür." />
                ) : null}
                <WeightProgressCard
                    data={weeklyWeightData}
                    selectedIndex={selectedWeekIndex}
                    onSelect={setSelectedWeekIndex}
                    maxChangeMagnitude={maxChangeMagnitude}
                    currentWeight={currentWeight}
                    startWeight={startWeight}
                    weightChange={weightChange}
                    monthLabel={monthLabel}
                    onAddWeight={handleOpenWeightEntry}
                />
                <BodyMeasurementsCard measurements={measurements} onEdit={handleEditMeasurementsToggle} onHistory={handleOpenMeasurementHistory} />
                <WaterHistoryCard history={waterHistory} total={totalWater} />
                <BadgesCard badges={badges} />
            </ScrollView>
            <MeasurementSheet
                visible={isEditingMeasurements && hasActiveDietitian}
                form={measurementForm}
                onChange={setMeasurementForm}
                onSave={handleSaveMeasurements}
                onClose={handleEditMeasurementsToggle}
                isSaving={isSavingMeasurements}
                bottomInset={insets.bottom}
            />
            <MeasurementHistorySheet
                visible={isMeasurementHistoryVisible && hasActiveDietitian}
                history={measurementHistory}
                status={measurementHistoryStatus}
                onClose={handleCloseMeasurementHistory}
                bottomInset={insets.bottom}
            />
            <WeightEntrySheet
                visible={isAddingWeight && hasActiveDietitian}
                value={weightInput}
                onChange={setWeightInput}
                onSave={handleSaveWeight}
                onClose={handleCloseWeightEntry}
                isSaving={isSavingWeight}
                bottomInset={insets.bottom}
            />
        </SafeAreaView>
    );
};

const screenStyles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.x5, paddingTop: spacing.x3, paddingBottom: spacing.x8, gap: spacing.x4 },
    title: { ...typography.screenTitle, color: colors.textPrimary },
    subtitle: { ...typography.supporting, color: colors.textSecondary, marginTop: 2 },
    loadingWrap: { flex: 1, paddingHorizontal: spacing.x5, paddingTop: spacing.x8 },
    skeletonGap: { marginTop: spacing.x4 },
    loadingText: { ...typography.supporting, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.x4 },
    centered: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.x5 },
    alertGap: { marginTop: spacing.x3 },
});

export default AnalysisScreen;
