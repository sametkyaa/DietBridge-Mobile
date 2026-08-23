'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../../../../../../../');
const chatRoot = path.join(root, 'apps/mobile/src/features/chat');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
// Contract tests inspect source text; normalize line endings so they are
// unaffected by CRLF/LF checkouts on different platforms.
const readChat = (relativePath) => fs.readFileSync(path.join(chatRoot, relativePath), 'utf8').replace(/\r\n/g, '\n');

const componentFiles = [
    'components/ChatComposer.js',
    'components/ChatMessageBubble.js',
];

test('feature flag is opt-in, defaults to disabled, and is documented in .env.example', () => {
    const flag = readChat('utils/chatImageFeatureFlag.js');
    assert.match(flag, /value === 'true'/);
    assert.match(flag, /process\.env\.EXPO_PUBLIC_ENABLE_CHAT_IMAGES/);

    const envExample = read('.env.example').replace(/\r\n/g, '\n');
    assert.match(envExample, /^EXPO_PUBLIC_ENABLE_CHAT_IMAGES=false$/m);
});

test('screens and components never import the Supabase client directly', () => {
    for (const file of [...componentFiles]) {
        const source = readChat(file);
        assert.doesNotMatch(source, /lib\/supabaseClient/, file);
        assert.doesNotMatch(source, /supabase\./, file);
    }
    const screen = read('apps/mobile/src/features/clients/screens/ChatScreen.js');
    assert.doesNotMatch(screen, /lib\/supabaseClient/);
});

test('image selection is local-only and starts no RPC or Storage work', () => {
    const hook = readChat('hooks/useChatImageUpload.js');
    const selectStart = hook.indexOf('const selectImage');
    const selectEnd = hook.indexOf('const startUpload');
    assert.ok(selectStart > 0 && selectEnd > selectStart);
    const selectionBody = hook.slice(selectStart, selectEnd);
    assert.match(selectionBody, /type: 'select'/);
    assert.doesNotMatch(selectionBody, /runStages|createChatImageUploadIntent|uploadCanonicalChatImage|finalizeChatImageMessage/);
    // The staged pipeline is only reachable from startUpload/retry.
    assert.match(hook, /await runStages\(operation, 'canonicalizing'\)/);
});

test('the upload lifecycle only ever uses the best-effort abort and never aborts a finalized intent', () => {
    const hook = readChat('hooks/useChatImageUpload.js');
    assert.match(hook, /takeChatImageIntentForAbort/);
    assert.match(hook, /operation\.finalized = true;/);
    assert.match(hook, /finalizeChatImageResources\(operation\)/);
    // Only the quiet variant may be invoked from the hook.
    assert.doesNotMatch(hook, /[^y]\babortChatImageUpload\(/);
});

test('the image service uploads with upsert disabled and adds no signed URL or download code', () => {
    const service = readChat('services/chatImageService.js');
    assert.match(service, /upsert: false/);
    assert.match(service, /rpc\('create_chat_image_upload_intent'/);
    assert.match(service, /rpc\('finalize_chat_image_message'/);
    assert.match(service, /rpc\('abort_chat_image_upload'/);
    assert.doesNotMatch(service, /createSignedUrl|createSignedUploadUrl|getPublicUrl|\.download\(/);
});

test('the read projection requests message_kind and the attachment join', () => {
    const service = readChat('services/chatService.js');
    assert.match(service, /\bmessage_kind\b/);
    assert.match(service, /attachment:chat_attachments\(/);
    for (const column of ['bucket_id', 'object_path', 'mime_type', 'byte_size', 'width', 'height']) {
        assert.match(service, new RegExp(`\\b${column}\\b`), column);
    }
    assert.match(service, /fetchChatMessageById/);
});

test('the composer keeps the text-only branch separate from the image branch', () => {
    const composer = readChat('components/ChatComposer.js');
    assert.match(composer, /if \(imageSelected\) \{/);
    assert.match(composer, /imageUpload\?\.startUpload\?\.\(draft\)/);
    assert.match(composer, /\n        onSubmit\(\);/);
    // The picker button is gated on the feature flag through the ui-state helper.
    assert.match(composer, /getChatImagePickerUiState\(featureEnabled, conversationId, disabled\)/);
});

test('the placeholder bubble never renders bucket or object path text', () => {
    const bubble = readChat('components/ChatMessageBubble.js');
    assert.match(bubble, /getChatImageBubbleLabel/);
    assert.doesNotMatch(bubble, /objectPath|bucketId|object_path|bucket_id/);
});
