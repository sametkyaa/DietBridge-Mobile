import { getLocalWeekDateKey, getLocalWeekDayOptions } from '../shared/utils/localDate';

export const macros = [
    { label: 'Karbonhidrat', current: 100, target: 150 },
    { label: 'Protein', current: 35, target: 95 },
    { label: 'Yağ', current: 15, target: 50 },
];

export const getDayOptions = (startDate = new Date()) => getLocalWeekDayOptions(startDate);

export const getDateFromWeekIndex = (index, startDate = new Date()) => (
    getLocalWeekDateKey(index, startDate)
);
