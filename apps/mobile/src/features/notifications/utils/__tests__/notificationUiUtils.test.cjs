'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    formatNotificationBadge,
    formatNotificationContext,
    formatNotificationRelativeTime,
    formatNotificationSummary,
    getNotificationCategoryIcon,
} = require('../notificationUiUtils.cjs');

const baseNotification = (overrides = {}) => ({
    category: 'chat_message',
    eventType: 'new_message',
    actorDisplayName: 'Mebrure Kaya',
    eventCount: 1,
    occurredAt: '2026-08-16T10:00:00Z',
    ...overrides,
});

test('notification badge uses exact values through 9 and 9+ after 10', () => {
    assert.equal(formatNotificationBadge(0), null);
    assert.equal(formatNotificationBadge(1), '1');
    assert.equal(formatNotificationBadge(9), '9');
    assert.equal(formatNotificationBadge(10), '9+');
    assert.equal(formatNotificationBadge(99), '9+');
});

test('Chat formatter is actor-safe, count-aware, and never requires body', () => {
    assert.equal(
        formatNotificationSummary(baseNotification()),
        'Mebrure Kaya size yeni bir mesaj gönderdi.',
    );
    assert.equal(
        formatNotificationSummary(baseNotification({ eventCount: 3 })),
        'Mebrure Kaya size 3 yeni mesaj gönderdi.',
    );
    assert.equal(
        formatNotificationSummary(baseNotification({ actorDisplayName: null, body: 'gizli metin' })),
        'Yeni mesajınız var.',
    );
});

test('appointment and relationship formatters use canonical safe event copy', () => {
    assert.equal(
        formatNotificationSummary({ category: 'appointment', eventType: 'created' }),
        'Yeni bir randevunuz var.',
    );
    assert.equal(
        formatNotificationSummary({ category: 'appointment', eventType: 'cancelled' }),
        'Randevunuz iptal edildi.',
    );
    assert.equal(
        formatNotificationSummary({ category: 'appointment', eventType: 'removed_from_client' }),
        'Randevunuz kaldırıldı.',
    );
    assert.equal(
        formatNotificationSummary({ category: 'appointment', eventType: 'reminder_24h' }),
        'Randevunuza 24 saat kaldı',
    );
    assert.equal(
        formatNotificationSummary({ category: 'appointment', eventType: 'reminder_1h' }),
        'Randevunuza 1 saat kaldı',
    );
    assert.equal(
        formatNotificationSummary({ category: 'relationship', eventType: 'request_pending' }),
        'Yeni bir diyetisyen bağlantı isteğiniz var.',
    );
    assert.equal(
        formatNotificationSummary({ category: 'relationship', eventType: 'removed' }),
        'Diyetisyen bağlantınız sonlandırıldı.',
    );
});

test('appointment context remains compact and uses snapshot metadata only', () => {
    assert.equal(
        formatNotificationContext({
            category: 'appointment',
            appointmentTitleSnapshot: 'Kontrol randevusu',
            appointmentDate: '2026-08-20',
            appointmentTime: '10:30:00',
        }),
        'Kontrol randevusu • 20 Ağu, 10:30',
    );
});

test('relative timestamps use Turkish-friendly short labels and older dates', () => {
    const now = new Date('2026-08-16T10:00:00Z');
    assert.equal(formatNotificationRelativeTime('2026-08-16T09:59:30Z', now), 'Şimdi');
    assert.equal(formatNotificationRelativeTime('2026-08-16T09:55:00Z', now), '5 dk önce');
    assert.equal(formatNotificationRelativeTime('2026-08-16T08:00:00Z', now), '2 sa önce');
    assert.equal(formatNotificationRelativeTime('2026-08-15T10:00:00Z', now), 'Dün');
    assert.match(formatNotificationRelativeTime('2026-07-01T10:00:00Z', now), /1 Tem/);
});

test('category icons stay within the existing icon system', () => {
    assert.equal(getNotificationCategoryIcon('chat_message'), 'message');
    assert.equal(getNotificationCategoryIcon('appointment'), 'calendar');
    assert.equal(getNotificationCategoryIcon('relationship'), 'person');
    assert.equal(getNotificationCategoryIcon('unknown'), 'bell');
});
