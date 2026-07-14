import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from '../theme/styles';
import { fontFamilies } from '../theme/fonts';

const monthlyWeightTrend = [
  { week: '1', dateLabel: '1-7 Kasım', weight: 84 },
  { week: '2', dateLabel: '8-14 Kasım', weight: 82.6 },
  { week: '3', dateLabel: '15-21 Kasım', weight: 81.3 },
  { week: '4', dateLabel: '22-28 Kasım', weight: 80.4 },
  { week: '5', dateLabel: '29-30 Kasım', weight: 78.9 },
];
const monthLabel = 'Kasım';
const measurements = [
  { label: 'Bel', value: '80', unit: 'cm', change: '-2cm' },
  { label: 'Kalça', value: '95', unit: 'cm', change: '-1cm' },
  { label: 'Kol', value: '30', unit: 'cm', change: '-0.5cm', detail: 'Sağ' },
];
const waterHistory = [
  { day: 'Pzt', amount: 2.0 },
  { day: 'Sal', amount: 2.1 },
  { day: 'Çar', amount: 1.7 },
  { day: 'Per', amount: 2.4 },
  { day: 'Cum', amount: 2.1 },
  { day: 'Cmt', amount: 2.3 },
  { day: 'Paz', amount: 1.8 },
];
const badges = [
  { label: 'Su Şampiyonu', icon: '💧', accent: '#E0EDFF' },
  { label: 'İlk 5 Kilo', icon: '🎯', accent: '#F9EFD3' },
  { label: '7 Günlük Seri', icon: '🔥', accent: '#FFE1E2' },
];


const AnalysisScreen = () => {
  const weeklyWeightData = monthlyWeightTrend.map((item, index) => {
    const previousWeight = index === 0 ? item.weight : monthlyWeightTrend[index - 1].weight;
    const change = index === 0 ? 0 : item.weight - previousWeight;
    return { ...item, change };
  });

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(weeklyWeightData.length - 1);
  const changeMagnitudes = weeklyWeightData.map((item) => Math.abs(item.change));
  const maxChangeMagnitude = Math.max(...changeMagnitudes, 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={analysisStyles.pageHeader}>
          <View>
            <Text style={analysisStyles.heading}>İlerleme Analizi</Text>
            <Text style={analysisStyles.subHeading}>Planınla senkron güncel özet</Text>
          </View>
          <TouchableOpacity style={analysisStyles.roundButton}>
            <Text style={analysisStyles.roundButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={analysisStyles.card}>
          <View style={analysisStyles.cardHeader}>
            <View>
              <Text style={analysisStyles.cardTitle}>Kilo Grafiği</Text>
              <Text style={analysisStyles.cardMeta}>{monthLabel}</Text>
            </View>
            <View style={analysisStyles.weightBlock}>
              <Text style={analysisStyles.weightValue}>78 kg</Text>
              <Text style={analysisStyles.weightChange}>-0.7 kg</Text>
            </View>
          </View>
          <View style={analysisStyles.weightChart}>
            {weeklyWeightData.map((item, index) => {
              const isActive = selectedWeekIndex === index;
              const changeText =
                item.change === 0 ? '0 kg' : `${item.change > 0 ? '+' : ''}${item.change.toFixed(1)} kg`;
              const changeRatio = Math.abs(item.change) / maxChangeMagnitude;
              const fillHeight = 12 + changeRatio * 110;
              const isGainWeek = item.change > 0;

              return (
                <TouchableOpacity
                  key={`weight-${item.week}`}
                  style={analysisStyles.weightBarWrapper}
                  activeOpacity={0.8}
                  onPress={() => setSelectedWeekIndex(index)}
                >
                  {isActive && (
                    <View style={analysisStyles.weightTooltip}>
                      <Text style={analysisStyles.weightTooltipText}>
                        {item.weight.toFixed(1)} kg
                      </Text>
                      <Text
                        style={[
                          analysisStyles.weightTooltipChange,
                          item.change > 0
                            ? analysisStyles.weightTooltipChangeGain
                            : analysisStyles.weightTooltipChangeLoss,
                        ]}
                      >
                        Haftalık değişim {changeText}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      analysisStyles.weightBarTrack,
                      isActive && analysisStyles.weightBarTrackActive,
                    ]}
                  >
                    <View
                      style={[
                        analysisStyles.weightBarFill,
                        {
                          height: fillHeight,
                          backgroundColor: isGainWeek ? '#FCA5A5' : '#16A34A',
                          opacity: isGainWeek ? 0.8 : 1,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      analysisStyles.weightBarLabel,
                      isActive && analysisStyles.weightBarLabelActive,
                    ]}
                  >
                    Hafta {item.week}
                  </Text>
                  <Text style={analysisStyles.weightBarDate}>{item.dateLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={analysisStyles.weightFooter}>
            <View>
              <Text style={analysisStyles.caption}>Başlangıç</Text>
              <Text style={analysisStyles.footerValue}>85 kg</Text>
            </View>
            <View style={analysisStyles.footerDivider} />
            <View>
              <Text style={analysisStyles.caption}>Güncel</Text>
              <Text style={analysisStyles.footerValue}>78 kg</Text>
            </View>
          </View>
        </View>

        <View style={analysisStyles.section}>
          <View style={analysisStyles.sectionHeadingRow}>
            <Text style={analysisStyles.sectionTitle}>Vücut Ölçüleri</Text>
            <Text style={analysisStyles.sectionHint}>Haftalık ölçümler</Text>
          </View>
          <View style={analysisStyles.measurementsRow}>
            {measurements.map((measurement) => (
              <View key={measurement.label} style={analysisStyles.measurementCard}>
                <View style={analysisStyles.measurementLabelRow}>
                  <Text style={analysisStyles.measurementLabel}>{measurement.label}</Text>
                  {measurement.detail && (
                    <Text style={analysisStyles.measurementDetail}>{measurement.detail}</Text>
                  )}
                </View>
                <Text style={analysisStyles.measurementValue}>
                  {measurement.value}
                  <Text style={analysisStyles.measurementUnit}> {measurement.unit}</Text>
                </Text>
                <Text style={analysisStyles.measurementChange}>{measurement.change}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={analysisStyles.card}>
          <View style={analysisStyles.cardHeader}>
            <View>
              <Text style={analysisStyles.cardTitle}>Su Tüketimi Analizi</Text>
              <Text style={analysisStyles.cardMeta}>Haftalık hedef 2.5L</Text>
            </View>
            <Text style={analysisStyles.cardMeta}>Bu hafta</Text>
          </View>
          <View style={analysisStyles.waterHighlight}>
            <Text style={analysisStyles.waterValue}>2.1L</Text>
            <Text style={analysisStyles.waterGoalText}>/ 2.5L hedef</Text>
          </View>
          <View style={analysisStyles.waterHistoryRow}>
            {waterHistory.map((day) => {
              const progress = Math.min(day.amount / 2.5, 1);
              return (
                <View key={day.day} style={analysisStyles.waterDayBlock}>
                  <View style={analysisStyles.progressTrack}>
                    <View style={[analysisStyles.progressFill, { height: `${progress * 100}%` }]} />
                  </View>
                  <Text style={analysisStyles.waterDayLabel}>{day.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={analysisStyles.section}>
          <Text style={analysisStyles.sectionTitle}>Kazanılan Rozetler</Text>
          <View style={analysisStyles.badgeRow}>
            {badges.map((badge, index) => (
              <View
                key={badge.label}
                style={[
                  analysisStyles.badgeÇard,
                  { backgroundColor: badge.accent, marginRight: index === badges.length - 1 ? 0 : 12 },
                ]}
              >
                <Text style={analysisStyles.badgeIcon}>{badge.icon}</Text>
                <Text style={analysisStyles.badgeLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const analysisStyles = StyleSheet.create({
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heading: {
    fontSize: 20,
    color: '#1F2A37',
    fontFamily: fontFamilies.semiBold,
  },
  subHeading: {
    marginTop: 4,
    color: '#6B7280',
    fontFamily: fontFamilies.regular,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundButtonText: {
    fontSize: 20,
    color: '#2E7D32',
    fontFamily: fontFamilies.semiBold,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    color: '#1F2A37',
    fontFamily: fontFamilies.medium,
  },
  cardMeta: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  weightBlock: {
    alignItems: 'flex-end',
  },
  weightValue: {
    fontSize: 32,
    color: '#1F2A37',
    fontFamily: fontFamilies.bold,
  },
  weightChange: {
    marginTop: 4,
    color: '#22C55E',
    fontFamily: fontFamilies.medium,
  },
  weightChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  weightBarWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  weightBarTrack: {
    height: 150,
    width: 20,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  weightBarTrackActive: {
    backgroundColor: '#DCFCE7',
    shadowColor: '#22C55E',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  weightBarFill: {
    width: '100%',
    borderRadius: 12,
  },
  weightBarLabel: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: fontFamilies.medium,
  },
  weightBarLabelActive: {
    color: '#047857',
  },
  weightBarDate: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: fontFamilies.regular,
    marginTop: 2,
  },
  weightTooltip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#047857',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  weightTooltipText: {
    color: '#FFFFFF',
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  weightTooltipChange: {
    fontSize: 11,
    fontFamily: fontFamilies.medium,
    marginTop: 2,
  },
  weightTooltipChangeLoss: {
    color: '#BBF7D0',
  },
  weightTooltipChangeGain: {
    color: '#FCA5A5',
  },
  weightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  caption: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: fontFamilies.regular,
  },
  footerValue: {
    marginTop: 4,
    fontSize: 16,
    color: '#1F2A37',
    fontFamily: fontFamilies.medium,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1F2A37',
    fontFamily: fontFamilies.semiBold,
  },
  sectionHint: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: fontFamilies.regular,
  },
  measurementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  measurementCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  measurementLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: fontFamilies.medium,
  },
  measurementDetail: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    fontSize: 11,
    fontFamily: fontFamilies.medium,
  },
  measurementValue: {
    fontSize: 22,
    color: '#1F2A37',
    fontFamily: fontFamilies.semiBold,
    marginTop: 6,
  },
  measurementUnit: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: fontFamilies.regular,
  },
  measurementChange: {
    marginTop: 4,
    color: '#22C55E',
    fontFamily: fontFamilies.medium,
  },
  waterHighlight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  waterValue: {
    fontSize: 32,
    color: '#1F2A37',
    fontFamily: fontFamilies.bold,
  },
  waterGoalText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: fontFamilies.regular,
  },
  waterHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterDayBlock: {
    alignItems: 'center',
    flex: 1,
  },
  progressTrack: {
    height: 140,
    width: 20,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    marginHorizontal: 4,
  },
  progressFill: {
    width: '100%',
    backgroundColor: '#0EA5E9',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  waterDayLabel: {
    marginTop: 6,
    color: '#6B7280',
    fontFamily: fontFamilies.medium,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeÇard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  badgeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  badgeLabel: {
    textAlign: 'center',
    color: '#1F2A37',
    fontFamily: fontFamilies.medium,
  },
});

export default AnalysisScreen;
