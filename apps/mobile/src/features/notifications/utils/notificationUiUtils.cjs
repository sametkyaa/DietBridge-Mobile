'use strict';

const {
    NOTIFICATION_CATEGORIES,
    NOTIFICATION_EVENT_TYPES,
} = require('../constants/notificationConstants');

const ISTANBUL_TIME_ZONE = 'Europe/Istanbul';

const CATEGORY_ICONS = Object.freeze({
    [NOTIFICATION_CATEGORIES.CHAT_MESSAGE]: 'message',
    [NOTIFICATION_CATEGORIES.APPOINTMENT]: 'calendar',
    [NOTIFICATION_CATEGORIES.RELATIONSHIP]: 'person',
});

const APPOINTMENT_COPY = Object.freeze({
    created: 'Yeni bir randevunuz var.',
    assigned: 'Yeni bir randevunuz var.',
    updated: 'Randevunuz güncellendi.',
    cancelled: 'Randevunuz iptal edildi.',
    removed_from_client: 'Randevunuz kaldırıldı.',
});

const RELATIONSHIP_COPY = Object.freeze({
    request_pending: 'Yeni bir diyetisyen bağlantı isteğiniz var.',
    accepted: 'Diyetisyen bağlantınız kabul edildi.',
    rejected: 'Diyetisyen bağlantı isteğiniz reddedildi.',
    removed: 'Diyetisyen bağlantınız sonlandırıldı.',
});

const safeText = (value) => (
    typeof value === 'string' && value.trim() ? value.trim() : null
);

const normalizeCount = (value) => (
    Number.isInteger(value) && value > 0 ? value : 0
);

const formatNotificationBadge = (unseenCount) => {
    const count = normalizeCount(unseenCount);
    if (count === 0) return null;
    return count >= 10 ? '9+' : String(count);
};

const getNotificationCategoryIcon = (category) => CATEGORY_ICONS[category] || 'bell';

const formatChatSummary = (notification) => {
    const actor = safeText(notification?.actorDisplayName);
    const count = normalizeCount(notification?.eventCount);
    if (!actor) return 'Yeni mesajınız var.';
    if (count > 1) return `${actor} size ${count} yeni mesaj gönderdi.`;
    return `${actor} size yeni bir mesaj gönderdi.`;
};

const formatAppointmentSummary = (notification) => (
    APPOINTMENT_COPY[notification?.eventType] || 'Randevu bildiriminiz var.'
);

const formatRelationshipSummary = (notification) => {
    const base = RELATIONSHIP_COPY[notification?.eventType] || 'Diyetisyen bağlantınızla ilgili yeni bir bildirim var.';
    const actor = safeText(notification?.actorDisplayName);
    if (actor && notification?.eventType === 'accepted') return `${actor} diyetisyen bağlantınızı kabul etti.`;
    if (actor && notification?.eventType === 'rejected') return `${actor} diyetisyen bağlantı isteğinizi reddetti.`;
    return base;
};

const formatNotificationSummary = (notification) => {
    if (notification?.category === NOTIFICATION_CATEGORIES.CHAT_MESSAGE
        && NOTIFICATION_EVENT_TYPES.CHAT_MESSAGE.includes(notification.eventType)) {
        return formatChatSummary(notification);
    }
    if (notification?.category === NOTIFICATION_CATEGORIES.APPOINTMENT
        && NOTIFICATION_EVENT_TYPES.APPOINTMENT.includes(notification.eventType)) {
        return formatAppointmentSummary(notification);
    }
    if (notification?.category === NOTIFICATION_CATEGORIES.RELATIONSHIP
        && NOTIFICATION_EVENT_TYPES.RELATIONSHIP.includes(notification.eventType)) {
        return formatRelationshipSummary(notification);
    }
    return 'Yeni bir bildiriminiz var.';
};

const formatAppointmentContext = (notification) => {
    const title = safeText(notification?.appointmentTitleSnapshot);
    const date = safeText(notification?.appointmentDate);
    const time = safeText(notification?.appointmentTime)?.slice(0, 5);
    let dateLabel = null;

    if (date) {
        const parsed = new Date(`${date}T12:00:00Z`);
        if (!Number.isNaN(parsed.getTime())) {
            dateLabel = parsed.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                timeZone: ISTANBUL_TIME_ZONE,
            });
        }
    }

    const schedule = [dateLabel, time].filter(Boolean).join(', ');
    return [title, schedule].filter(Boolean).join(' • ');
};

const formatNotificationContext = (notification) => {
    if (notification?.category === NOTIFICATION_CATEGORIES.APPOINTMENT) {
        return formatAppointmentContext(notification);
    }
    return '';
};

const getIstanbulDateKey = (date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: ISTANBUL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
};

const formatNotificationRelativeTime = (occurredAt, now = new Date()) => {
    const occurred = new Date(occurredAt);
    const current = now instanceof Date ? now : new Date(now);
    if (Number.isNaN(occurred.getTime()) || Number.isNaN(current.getTime())) return '';

    const difference = Math.max(0, current.getTime() - occurred.getTime());
    const minutes = Math.floor(difference / 60000);
    const hours = Math.floor(minutes / 60);
    const dateChanged = getIstanbulDateKey(occurred) !== getIstanbulDateKey(current);

    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24 && !dateChanged) return `${hours} sa önce`;
    if (difference < 48 * 60 * 60 * 1000) return 'Dün';

    return occurred.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: occurred.getFullYear() !== current.getFullYear() ? 'numeric' : undefined,
        timeZone: ISTANBUL_TIME_ZONE,
    });
};

module.exports = {
    formatNotificationBadge,
    formatNotificationContext,
    formatNotificationRelativeTime,
    formatNotificationSummary,
    getNotificationCategoryIcon,
};
