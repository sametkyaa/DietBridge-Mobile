'use strict';

const APPOINTMENT_TIME_ZONE = 'Europe/Istanbul';
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/;

const APPOINTMENT_TYPES = Object.freeze([
    'Görüntülü Görüşme',
    'Yüzyüze',
    'Telefon Görüşmesi',
]);

const APPOINTMENT_STATUSES = Object.freeze(['upcoming', 'completed', 'cancelled']);

const APPOINTMENT_TYPE_ALIASES = Object.freeze({
    online: 'Görüntülü Görüşme',
    in_person: 'Yüzyüze',
    phone: 'Telefon Görüşmesi',
});

const APPOINTMENT_STATUS_LABELS = Object.freeze({
    upcoming: 'Yaklaşan',
    in_progress: 'Devam ediyor',
    past: 'Geçmiş',
    completed: 'Tamamlandı',
    cancelled: 'İptal edildi',
});

const isNonEmptyString = (value) => typeof value === 'string' && Boolean(value.trim());

const parseDateKey = (value) => {
    if (typeof value !== 'string') return null;
    const match = DATE_KEY_PATTERN.exec(value);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);

    if (
        date.getUTCFullYear() !== year
        || date.getUTCMonth() !== month - 1
        || date.getUTCDate() !== day
    ) return null;

    return date;
};

const createCivilDateTime = (dateKey, timeKey) => {
    const date = parseDateKey(dateKey);
    const timeMatch = typeof timeKey === 'string' ? TIME_PATTERN.exec(timeKey) : null;
    if (!date || !timeMatch) throw new Error('Geçersiz randevu tarih/saat bilgisi.');

    const dateTime = new Date(date.getTime());
    dateTime.setUTCHours(
        Number(timeKey.slice(0, 2)),
        Number(timeKey.slice(3, 5)),
        timeKey.length >= 8 ? Number(timeKey.slice(6, 8)) : 0,
        0,
    );
    return dateTime;
};

const getIstanbulDateTimeParts = (instant = new Date()) => {
    if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
        throw new Error('Geçerli bir tarih bulunamadı.');
    }

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APPOINTMENT_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(instant);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        time: `${values.hour}:${values.minute}:${values.second}`,
    };
};

const getIstanbulCivilDateTime = (instant = new Date()) => {
    const parts = getIstanbulDateTimeParts(instant);
    return createCivilDateTime(parts.date, parts.time);
};

const normalizeDateKey = (value) => {
    if (!parseDateKey(value)) throw new Error('Geçersiz randevu tarihi.');
    return value;
};

const normalizeAppointmentTime = (value) => {
    if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
        throw new Error('Geçersiz randevu saati.');
    }
    return value.slice(0, 5);
};

const normalizeAppointmentType = (value) => {
    if (APPOINTMENT_TYPES.includes(value)) return value;
    return APPOINTMENT_TYPE_ALIASES[value] || null;
};

const normalizeAppointmentStatus = (value) => (
    APPOINTMENT_STATUSES.includes(value) ? value : null
);

const normalizeAppointment = (row, currentUserId) => {
    if (!row || typeof row !== 'object') throw new Error('Geçersiz randevu kaydı.');
    if (!isNonEmptyString(row.id) || !isNonEmptyString(row.client_id)) {
        throw new Error('Randevu sahipliği doğrulanamadı.');
    }
    if (!isNonEmptyString(currentUserId) || row.client_id !== currentUserId) {
        throw new Error('Randevu sahipliği doğrulanamadı.');
    }
    if (!isNonEmptyString(row.dietitian_id)) throw new Error('Randevu sahibi doğrulanamadı.');
    if (!isNonEmptyString(row.title)) throw new Error('Geçersiz randevu başlığı.');

    const status = normalizeAppointmentStatus(row.status);
    if (!status) throw new Error('Geçersiz randevu durumu.');

    let duration = null;
    if (row.duration !== null && row.duration !== undefined) {
        if (!Number.isInteger(row.duration) || row.duration <= 0) {
            throw new Error('Geçersiz randevu süresi.');
        }
        duration = row.duration;
    }

    return {
        id: row.id,
        clientId: row.client_id,
        dietitianId: row.dietitian_id,
        title: row.title.trim(),
        date: normalizeDateKey(row.date),
        time: normalizeAppointmentTime(row.time),
        duration,
        type: normalizeAppointmentType(row.type),
        status,
    };
};

const compareAppointmentsChronologically = (left, right) => (
    `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)
    || String(left.id).localeCompare(String(right.id))
);

const sortAppointmentsChronologically = (appointments) => (
    [...appointments].sort(compareAppointmentsChronologically)
);

const getAppointmentTimeWindow = (appointment) => {
    const startDateTime = createCivilDateTime(appointment.date, appointment.time);
    const hasTrustworthyDuration = Number.isInteger(appointment.duration) && appointment.duration > 0;
    const endDateTime = hasTrustworthyDuration
        ? new Date(startDateTime.getTime() + appointment.duration * 60 * 1000)
        : new Date(startDateTime.getTime());

    return { startDateTime, endDateTime };
};

const classifyAppointment = (appointment, instant = new Date()) => {
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        return {
            ...appointment,
            tab: 'past',
            displayStatus: appointment.status,
        };
    }

    const nowDateTime = getIstanbulCivilDateTime(instant);
    const { startDateTime, endDateTime } = getAppointmentTimeWindow(appointment);
    const isElapsed = endDateTime.getTime() <= nowDateTime.getTime();
    if (isElapsed) {
        return {
            ...appointment,
            tab: 'past',
            displayStatus: 'past',
        };
    }

    const hasTrustworthyDuration = Number.isInteger(appointment.duration) && appointment.duration > 0;
    const isInProgress = hasTrustworthyDuration
        && startDateTime.getTime() <= nowDateTime.getTime()
        && nowDateTime.getTime() < endDateTime.getTime();

    return {
        ...appointment,
        tab: 'upcoming',
        displayStatus: isInProgress ? 'in_progress' : 'upcoming',
    };
};

const partitionAppointments = (appointments, instant = new Date()) => {
    const classifiedAppointments = appointments.map((appointment) => (
        classifyAppointment(appointment, instant)
    ));
    const upcoming = sortAppointmentsChronologically(
        classifiedAppointments.filter((appointment) => appointment.tab === 'upcoming'),
    );
    const past = sortAppointmentsChronologically(
        classifiedAppointments.filter((appointment) => appointment.tab === 'past'),
    ).reverse();

    return { upcoming, past };
};

const formatAppointmentDate = (dateKey, options = {}) => {
    const date = parseDateKey(dateKey);
    if (!date) throw new Error('Geçersiz randevu tarihi.');

    return new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
        ...options,
    }).format(date);
};

const getTodayDateKey = (instant = new Date()) => {
    return getIstanbulDateTimeParts(instant).date;
};

const getAppointmentStatusLabel = (status) => APPOINTMENT_STATUS_LABELS[status] || 'Bilinmeyen durum';

const getAppointmentBadgeStatus = (status) => (
    status === 'cancelled' || status === 'past' || status === 'in_progress' ? 'info' : status
);

const formatAppointmentDuration = (duration) => (
    Number.isInteger(duration) && duration > 0 ? `${duration} dakika` : null
);

module.exports = {
    APPOINTMENT_STATUSES,
    APPOINTMENT_TIME_ZONE,
    APPOINTMENT_TYPES,
    classifyAppointment,
    compareAppointmentsChronologically,
    formatAppointmentDate,
    formatAppointmentDuration,
    getAppointmentBadgeStatus,
    getAppointmentStatusLabel,
    getAppointmentTimeWindow,
    getIstanbulCivilDateTime,
    getTodayDateKey,
    normalizeAppointment,
    normalizeAppointmentStatus,
    normalizeAppointmentTime,
    normalizeAppointmentType,
    parseDateKey,
    partitionAppointments,
    sortAppointmentsChronologically,
};
