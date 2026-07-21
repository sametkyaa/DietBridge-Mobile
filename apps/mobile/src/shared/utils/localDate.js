const dayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const cloneLocalDate = (value) => new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
);

export const toLocalDateKey = (date = new Date()) => {
    const localDate = cloneLocalDate(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getLocalWeekStart = (date = new Date()) => {
    const weekStart = cloneLocalDate(date);
    const daysFromMonday = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - daysFromMonday);
    return weekStart;
};

export const getLocalWeekDate = (weekIndex, date = new Date()) => {
    if (!Number.isInteger(weekIndex) || weekIndex < 0 || weekIndex > 6) {
        throw new Error('Geçerli bir hafta günü bulunamadı.');
    }

    const selectedDate = getLocalWeekStart(date);
    selectedDate.setDate(selectedDate.getDate() + weekIndex);
    return selectedDate;
};

export const getLocalWeekDateKey = (weekIndex, date = new Date()) => (
    toLocalDateKey(getLocalWeekDate(weekIndex, date))
);

export const getLocalWeekDayOptions = (date = new Date()) => (
    dayLabels.map((label, index) => {
        const currentDate = getLocalWeekDate(index, date);
        return `${label} ${String(currentDate.getDate()).padStart(2, '0')}`;
    })
);
