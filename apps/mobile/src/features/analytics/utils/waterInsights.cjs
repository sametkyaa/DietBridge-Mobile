'use strict';

const WATER_PERIODS = [7, 30];
const DAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const DAY_NAMES = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
// Logged amounts are stored in liters with float noise, so treat a day as on target within 1 ml.
const GOAL_TOLERANCE_LITERS = 0.001;

const formatLiters = (value) => (Number.isFinite(value) ? value : 0).toFixed(1).replace('.', ',');

const parseDateKey = (dateKey) => {
    const [year, month, day] = String(dateKey).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
};

const shiftDateKey = (dateKey, amount) => {
    const date = parseDateKey(dateKey);
    date.setUTCDate(date.getUTCDate() + amount);
    return date.toISOString().slice(0, 10);
};

// One entry per calendar day ending today; days without a log keep amount null so the chart can show the gap.
const buildWaterSeries = (history, todayKey, days) => {
    const amounts = new Map();
    (Array.isArray(history) ? history : []).forEach((item) => {
        const amount = Number(item?.amount);
        if (item?.dateKey && Number.isFinite(amount)) amounts.set(item.dateKey, amount);
    });

    return Array.from({ length: days }, (_, index) => {
        const dateKey = shiftDateKey(todayKey, index - (days - 1));
        const date = parseDateKey(dateKey);
        return {
            dateKey,
            day: DAY_LABELS[date.getUTCDay()],
            dayName: DAY_NAMES[date.getUTCDay()],
            dateLabel: `${date.getUTCDate()} ${MONTH_LABELS[date.getUTCMonth()]}`,
            amount: amounts.has(dateKey) ? amounts.get(dateKey) : null,
        };
    });
};

const summarizeWaterSeries = (series, goalLiters) => {
    const logged = series.filter((item) => item.amount !== null);
    const total = logged.reduce((sum, item) => sum + item.amount, 0);
    const reachesGoal = (item) => Number.isFinite(goalLiters) && goalLiters > 0
        && item.amount + GOAL_TOLERANCE_LITERS >= goalLiters;

    return {
        days: series.length,
        loggedDays: logged.length,
        missingDays: series.length - logged.length,
        total,
        average: logged.length > 0 ? total / logged.length : null,
        goalDays: logged.filter(reachesGoal).length,
        best: logged.reduce((best, item) => (!best || item.amount > best.amount ? item : best), null),
        lowest: logged.reduce((low, item) => (!low || item.amount < low.amount ? item : low), null),
        reachesGoal,
    };
};

const describeWaterSummary = (summary, goalLiters) => {
    if (summary.loggedDays === 0) return `Son ${summary.days} günde su kaydı yok.`;

    const parts = [`Son ${summary.days} günün ${summary.goalDays} gününde hedefe ulaştın.`];
    if (summary.missingDays > 0) {
        parts.push(`${summary.missingDays} gün kayıt girilmedi.`);
    } else if (summary.lowest && summary.loggedDays > 1) {
        parts.push(`En düşük gün ${summary.lowest.dayName} oldu, ${formatLiters(summary.lowest.amount)} L.`);
    }
    if (Number.isFinite(goalLiters) && summary.average !== null && goalLiters - summary.average >= 0.05) {
        parts.push(`Hedefe ulaşmak için günde ortalama ${formatLiters(goalLiters - summary.average)} L daha içmen yeterli.`);
    }
    return parts.join(' ');
};

module.exports = {
    WATER_PERIODS,
    buildWaterSeries,
    describeWaterSummary,
    formatLiters,
    summarizeWaterSeries,
};
