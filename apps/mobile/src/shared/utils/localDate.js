const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const {
    addIstanbulDays,
    civilDateFromInstant,
    toIstanbulDateKey,
} = require('./istanbulDateContract.cjs');

export const toLocalDateKey = (date = new Date()) => {
    return toIstanbulDateKey(date);
};

export const getLocalWeekStart = (date = new Date()) => {
    const weekStart = civilDateFromInstant(date);
    const daysFromMonday = (weekStart.getUTCDay() + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - daysFromMonday);
    return weekStart;
};

export const getLocalWeekDate = (weekIndex, date = new Date()) => {
    if (!Number.isInteger(weekIndex) || weekIndex < 0 || weekIndex > 6) {
        throw new Error('Geçerli bir hafta günü bulunamadı.');
    }

    const selectedDate = getLocalWeekStart(date);
    selectedDate.setUTCDate(selectedDate.getUTCDate() + weekIndex);
    return selectedDate;
};

export const getLocalWeekDateKey = (weekIndex, date = new Date()) => (
    getLocalWeekDate(weekIndex, date).toISOString().slice(0, 10)
);

export const addLocalDateDays = (date, amount) => addIstanbulDays(date, amount);

export const getLocalWeekDayOptions = (date = new Date()) => (
    dayLabels.map((label, index) => {
        const currentDate = getLocalWeekDate(index, date);
        return `${label} ${String(currentDate.getUTCDate()).padStart(2, '0')}`;
    })
);
