'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../../../../../');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const chatRoot = path.join(root, 'apps/mobile/src/features/chat');
const readChatSources = () => fs.readdirSync(chatRoot, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => fs.readFileSync(path.join(entry.parentPath || entry.path, entry.name), 'utf8'))
    .join('\n');

test('chat writes use only canonical RPCs and contain no direct table DML', () => {
    const service = read('apps/mobile/src/features/chat/services/chatService.js');
    assert.match(service, /rpc\('delete_chat_message'/);
    assert.match(service, /rpc\('mark_chat_conversation_delivered'/);
    assert.match(service, /rpc\('mark_chat_conversation_read'/);
    assert.doesNotMatch(service, /from\('chat_messages'\)[\s\S]{0,120}\.(insert|update|delete|upsert)\(/);
    assert.doesNotMatch(service, /from\('chat_read_states'\)[\s\S]{0,120}\.(insert|update|delete|upsert)\(/);
});

test('realtime listens to scoped message and receipt updates with scoped cleanup', () => {
    const realtime = read('apps/mobile/src/features/chat/services/chatRealtimeService.js');
    assert.match(realtime, /event: 'UPDATE'[\s\S]*table: 'chat_messages'/);
    assert.match(realtime, /event: 'UPDATE'[\s\S]*table: 'chat_read_states'/);
    assert.match(realtime, /supabase\.removeChannel\(channel\)/);
    assert.doesNotMatch(readChatSources(), /removeAllChannels\s*\(/);
    assert.doesNotMatch(readChatSources(), /setInterval\s*\(/);
});

test('foreground and chat focus reconcile latest history into the FlatList source', () => {
    const realtime = read('apps/mobile/src/features/chat/hooks/useChatRealtime.js');
    const viewModel = read('apps/mobile/src/features/chat/viewmodels/useChatViewModel.js');
    const list = read('apps/mobile/src/features/chat/components/ChatMessageList.js');
    assert.match(realtime, /isScreenFocused\s*=\s*false/);
    assert.match(realtime, /isActiveAppState\(appState\)\s*&&\s*isScreenFocused/);
    assert.match(realtime, /scheduler\.notify\(\)/);
    assert.match(viewModel, /mergeLatestCanonicalHistory/);
    assert.match(viewModel, /const addedMessages = mergeServerMessages\(page\.messages\)/);
    assert.match(viewModel, /if \(addedMessages\.length\) setRealtimeScrollToken/);
    assert.match(list, /data=\{Array\.isArray\(messages\) \? messages : \[\]\}/);
    assert.match(list, /onContentSizeChange=\{\(_, contentHeight\) => positionInitialLatest\(contentHeight\)\}/);
    assert.match(list, /shouldPositionInitialChat/);
    assert.match(list, /if \(!bottomScrollToken\) return undefined;/);
});

test('keyboard and composer source retain the required flex layout contract', () => {
    const screen = read('apps/mobile/src/features/clients/screens/ChatScreen.js');
    const composer = read('apps/mobile/src/features/chat/components/ChatComposer.js');
    const appConfig = JSON.parse(read('app.json'));
    assert.match(screen, /<KeyboardAvoidingView/);
    assert.match(screen, /keyboardVerticalOffset=\{0\}/);
    assert.match(screen, /chatRoot:\s*\{\s*flex:\s*1\s*\}/);
    assert.match(screen, /listArea:\s*\{\s*flex:\s*1\s*\}/);
    assert.match(composer, /maxHeight:\s*112/);
    assert.ok([undefined, 'resize'].includes(appConfig.expo?.android?.softwareKeyboardLayoutMode));
});

test('chat header consumes the resolved dietitian avatar with an image-error fallback', () => {
    const screen = read('apps/mobile/src/features/clients/screens/ChatScreen.js');
    const connectionService = read('apps/mobile/src/features/dietitianConnection/services/dietitianConnectionService.js');
    const clientService = read('apps/mobile/src/features/clients/services/clientService.js');
    assert.match(connectionService, /select\('id, email, full_name, avatar_url'\)/);
    assert.match(connectionService, /getAvatarSignedUrl\(profile\.avatarPath\)/);
    assert.match(clientService, /new URL\(objectPath\)/);
    assert.match(clientService, /remoteUrl\.protocol === 'https:'/);
    assert.match(screen, /onError=\{\(\) => setImageFailed\(true\)\}/);
    assert.match(screen, /avatar\.initials/);
});

test('message UI exposes guarded delete and tombstone behavior', () => {
    const bubble = read('apps/mobile/src/features/chat/components/ChatMessageBubble.js');
    const screen = read('apps/mobile/src/features/clients/screens/ChatScreen.js');
    assert.match(bubble, /onLongPress=\{requestDelete\}/);
    assert.match(bubble, /canDeleteChatMessage\(message\)/);
    assert.match(bubble, /Bu mesaj silindi/);
    assert.match(screen, /Bu mesaj herkes için silinsin mi\?/);
});
