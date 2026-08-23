'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../../../../../../..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const service = read('apps/mobile/src/features/notifications/services/notificationService.js');
const realtime = read('apps/mobile/src/features/notifications/services/notificationRealtimeService.js');
const realtimePolicy = read('apps/mobile/src/features/notifications/utils/notificationRealtimePolicy.cjs');
const context = read('apps/mobile/src/features/notifications/context/NotificationContext.js');

test('notification list query is authenticated, bounded, newest-first, and keyset-paginated', () => {
    assert.match(service, /supabase\.auth\.getUser\(\)/);
    assert.match(service, /\.from\('notifications'\)/);
    assert.match(service, /\.eq\('recipient_id', user\.id\)/);
    assert.match(service, /\.order\('occurred_at', \{ ascending: false \}\)/);
    assert.match(service, /\.order\('id', \{ ascending: false \}\)/);
    assert.match(service, /\.limit\(size \+ 1\)/);
    assert.match(service, /occurred_at\.lt\./);
    assert.match(service, /occurred_at\.eq\./);
    assert.doesNotMatch(service, /\.range\(/);
    assert.doesNotMatch(service, /recipientId\s*[,=]/);
});

test('unread and unseen semantics use separate canonical columns', () => {
    assert.match(service, /\.is\('read_at', null\)/);
    assert.match(service, /\.is\('seen_at', null\)/);
    assert.match(service, /select\('id', \{ count: 'exact', head: true \}\)/);
});

test('notification select columns never include Chat body fields', () => {
    const constants = read('apps/mobile/src/features/notifications/constants/notificationConstants.js');
    assert.doesNotMatch(constants, /message_text/);
    assert.doesNotMatch(constants, /\bbody\b/);
    assert.doesNotMatch(service, /message_text/);
});

test('all mutations use canonical RPCs and never direct notification DML', () => {
    assert.match(service, /'mark_notification_seen'/);
    assert.match(service, /'mark_notification_read'/);
    assert.match(service, /'mark_notifications_seen'/);
    assert.match(service, /rpc\('mark_all_notifications_read', \{\}\)/);
    assert.doesNotMatch(service, /from\('notifications'\)[\s\S]{0,240}\.(insert|update|delete|upsert)\(/);
    assert.doesNotMatch(service, /forEach\(.*markNotification/);
    assert.match(service, /NOTIFICATION_BATCH_MAX_SIZE/);
});

test('Realtime subscribes only to authenticated INSERT/UPDATE rows and cleans up', () => {
    assert.match(realtime, /getAuthenticatedNotificationUser/);
    assert.match(realtimePolicy, /mobile-notifications/);
    assert.match(realtime, /event: 'INSERT'/);
    assert.match(realtime, /event: 'UPDATE'/);
    assert.match(realtime, /table: 'notifications'/);
    assert.match(realtimePolicy, /recipient_id=eq/);
    assert.match(realtime, /supabase\.removeChannel\(channel\)/);
    assert.doesNotMatch(realtime, /event: 'DELETE'/);
    assert.doesNotMatch(realtime, /removeAllChannels/);
});

test('provider exposes the Phase 4B controller interface and lifecycle guards', () => {
    for (const name of ['notifications', 'unseenCount', 'isLoading', 'isRefreshing', 'hasMore', 'loadMore', 'refresh', 'markSeen', 'markRead', 'markVisibleSeen', 'markAllRead', 'queryMode']) {
        assert.match(context, new RegExp(`\\b${name}\\b`));
    }
    assert.match(context, /AppState\.addEventListener\('change'/);
    assert.match(context, /createNotificationRefreshScheduler/);
    assert.match(context, /sessionGenerationRef/);
    assert.match(context, /mergeNotifications/);
    assert.doesNotMatch(context, /setInterval\(/);
    assert.doesNotMatch(context, /\.from\('notifications'\)/);
});

test('App integrates the provider without adding visible notification UI', () => {
    const app = read('App.js');
    assert.match(app, /NotificationProvider/);
    assert.doesNotMatch(app, /NotificationScreen|NotificationBell|Bell/);
});
