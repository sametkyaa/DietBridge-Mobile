'use strict';

const TIME_ZONE = 'Europe/Istanbul';

const dateParts = (value) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new Error('Geçerli bir tarih bulunamadı.');
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
};

const toIstanbulDateKey = (value = new Date()) => {
    const { year, month, day } = dateParts(value);
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const civilDateFromInstant = (value = new Date()) => {
    const { year, month, day } = dateParts(value);
    return new Date(Date.UTC(year, month - 1, day));
};

const addIstanbulDays = (value, amount) => {
    if (!Number.isInteger(amount)) throw new Error('Geçerli bir gün farkı bulunamadı.');
    const civilDate = civilDateFromInstant(value);
    civilDate.setUTCDate(civilDate.getUTCDate() + amount);
    return civilDate.toISOString().slice(0, 10);
};

module.exports = {
    TIME_ZONE,
    addIstanbulDays,
    civilDateFromInstant,
    toIstanbulDateKey,
};
