'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Bell is a11y-safe, badge-only, and placed immediately before the existing avatar', () => {
    const bell = read('apps/mobile/src/features/notifications/components/NotificationBell.js');
    const uiUtils = read('apps/mobile/src/features/notifications/utils/notificationUiUtils.cjs');
    const header = read('apps/mobile/src/features/clients/components/dashboard/DashboardHeader.js');
    const dashboard = read('apps/mobile/src/features/clients/screens/DashboardScreen.js');

    assert.match(bell, /accessibilityLabel/);
    assert.match(bell, /Bildirimleri aç/);
    assert.match(bell, /formatNotificationBadge/);
    assert.match(uiUtils, /9\+/);
    assert.match(header, /<NotificationBell/);
    assert.match(header, /<Pressable[\s\S]*Menüyü aç/);
    assert.match(header, /styles\.actions/);
    assert.match(dashboard, /useNotifications/);
    assert.match(dashboard, /navigation\.navigate\('NotificationCenter'\)/);
    assert.doesNotMatch(dashboard, /NotificationCard|Bildirimler yüklenemedi/);
});

test('Notification screen is a dedicated stack destination, not a tab or drawer row', () => {
    const rootNavigator = read('apps/mobile/src/navigation/RootNavigator.js');
    const mainTabs = read('apps/mobile/src/navigation/MainTabs.js');
    const sidebar = read('apps/mobile/src/features/clients/components/dashboard/DashboardSidebar.js');
    const screen = read('apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js');

    assert.match(rootNavigator, /Stack\.Screen name="NotificationCenter" component=\{NotificationCenterScreen\}/);
    assert.doesNotMatch(mainTabs, /NotificationCenter|Bildirimler/);
    assert.doesNotMatch(sidebar, /NotificationCenter|Bildirimler/);
    assert.match(screen, /Bildirimler/);
    assert.match(screen, /Tümü/);
    assert.match(screen, /Okunmamış/);
    assert.match(screen, /Tümünü okundu işaretle/);
    assert.match(screen, /FlatList/);
});

test('screen uses the shared controller for loading, pagination, viewability, read, and mark-all state', () => {
    const screen = read('apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js');

    assert.match(screen, /useNotifications/);
    assert.match(screen, /onViewableItemsChanged/);
    assert.match(screen, /viewabilityConfig/);
    assert.match(screen, /markVisibleSeen/);
    assert.match(screen, /markRead/);
    assert.match(screen, /markAllRead/);
    assert.match(screen, /Daha fazla yükle/);
    assert.match(screen, /NotificationLoadingState/);
    assert.match(screen, /Bildirimler yüklenemedi\./);
    assert.match(screen, /Henüz bildiriminiz yok\./);
    assert.match(screen, /Okunmamış bildiriminiz yok\./);
    assert.match(screen, /Tekrar dene/);
    assert.match(screen, /VIEWABILITY_CONFIG/);
    assert.match(screen, /onViewableItemsChangedRef = useRef/);
    assert.doesNotMatch(screen, /IntersectionObserver/);
    assert.doesNotMatch(screen, /supabase/);
});

test('card copy is centralized, native-text-only, and keeps read/unread treatment compact', () => {
    const card = read('apps/mobile/src/features/notifications/components/NotificationCard.js');
    const formatter = read('apps/mobile/src/features/notifications/utils/notificationUiUtils.cjs');

    assert.match(card, /formatNotificationSummary/);
    assert.match(card, /formatNotificationRelativeTime/);
    assert.match(card, /readAt === null/);
    assert.match(card, /colors\.primarySurface/);
    assert.match(card, /Text/);
    assert.doesNotMatch(card, /message_text|dangerouslySetInnerHTML|WebView/);
    assert.match(formatter, /\$\{actor\} size/);
    assert.match(formatter, /Yeni mesajınız var/);
    assert.match(formatter, /Randevunuz güncellendi/);
    assert.match(formatter, /Randevunuza 24 saat kaldı/);
    assert.match(formatter, /Randevunuza 1 saat kaldı/);
    assert.match(formatter, /Diyetisyen bağlantınız sonlandırıldı/);
});

test('deep-links use existing authorized service boundaries and never query Supabase from UI', () => {
    const screen = read('apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js');
    const navigationService = read('apps/mobile/src/features/notifications/services/notificationNavigationService.js');
    const navigationResolver = read('apps/mobile/src/features/notifications/utils/notificationNavigationResolver.cjs');
    const appointmentService = read('apps/mobile/src/features/appointments/services/appointmentService.js');

    assert.match(screen, /resolveNotificationDestination/);
    assert.match(screen, /markRead\(notification\.id\)/);
    assert.match(screen, /AppointmentDetail/);
    assert.match(screen, /MainTabs', \{ screen: 'Sohbet' \}/);
    assert.match(navigationService, /getChatConversationByRelationId/);
    assert.match(navigationService, /fetchClientAppointmentById/);
    assert.match(navigationResolver, /notification\.appointmentId/);
    assert.match(navigationResolver, /removedAppointment/);
    assert.doesNotMatch(screen, /from\(['"]|supabase/);
    assert.doesNotMatch(navigationService, /supabase/);
    assert.match(appointmentService, /fetchClientAppointmentById/);
    assert.match(appointmentService, /\.eq\('client_id', user\.id\)/);
    assert.match(appointmentService, /\.eq\('id', appointmentId\)/);
    assert.match(appointmentService, /normalizeAppointment\(response\.data, user\.id\)/);
});

test('one Notification provider remains the shared state boundary', () => {
    const app = read('App.js');
    const provider = read('apps/mobile/src/features/notifications/context/NotificationContext.js');
    const screen = read('apps/mobile/src/features/notifications/screens/NotificationCenterScreen.js');

    assert.match(app, /<NotificationProvider userId=\{authState\.user\?\.id \|\| null\}/);
    assert.match(provider, /subscribeToNotificationChanges/);
    assert.match(provider, /resetNotificationState/);
    assert.match(provider, /AppState/);
    assert.doesNotMatch(screen, /subscribeToNotificationChanges|createNotificationRealtimeSubscription/);
});
