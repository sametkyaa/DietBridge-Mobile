'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const ui = require('../chatImageUiState');

const idle = () => ({
    status: 'idle', operationId: 0, conversationId: null, clientMessageId: null,
    source: null, previewUri: null, canonical: null, intent: null, progress: null, error: null, retryStage: null,
});

const selected = (overrides = {}) => ({
    ...idle(),
    status: 'selected',
    operationId: 1,
    conversationId: '11111111-1111-4111-8111-111111111111',
    clientMessageId: '22222222-2222-4222-8222-222222222222',
    source: { name: 'olcum.jpg', mimeType: 'image/png', byteSize: 1200 },
    previewUri: 'file:///preview.jpg',
    ...overrides,
});

test('flag false hides the image picker', () => {
    const picker = ui.getChatImagePickerUiState(false, '11111111-1111-4111-8111-111111111111', false);
    assert.equal(picker.visible, false);
    assert.equal(picker.enabled, false);
});

test('flag true without conversationId keeps picker visible but disabled with the required message', () => {
    const picker = ui.getChatImagePickerUiState(true, null, false);
    assert.equal(picker.visible, true);
    assert.equal(picker.enabled, false);
    assert.equal(picker.disabledMessage, 'Görsel göndermek için önce bir metin mesajı gönderin.');
});

test('flag true with a conversation enables the picker unless the composer is disabled', () => {
    assert.equal(ui.getChatImagePickerUiState(true, '11111111-1111-4111-8111-111111111111', false).enabled, true);
    assert.equal(ui.getChatImagePickerUiState(true, '11111111-1111-4111-8111-111111111111', true).enabled, false);
});

test('picker MIME guard allows only JPEG, PNG and WebP', () => {
    for (const mime of ['image/jpeg', 'image/png', 'image/webp']) {
        assert.equal(ui.isChatImagePickerFileAccepted(mime), true, mime);
    }
    for (const mime of ['image/heic', 'image/gif', 'image/svg+xml', 'application/pdf', 'image/JPEG']) {
        assert.equal(ui.isChatImagePickerFileAccepted(mime), false, mime);
    }
});

test('a selected image can send with an empty caption', () => {
    assert.equal(ui.canSendChatComposer('', false, false, selected()), true);
    assert.equal(ui.canSendChatComposer('   ', false, false, selected()), true);
});

test('empty text without an image cannot send', () => {
    assert.equal(ui.canSendChatComposer('', false, false, idle()), false);
    assert.equal(ui.canSendChatComposer('   ', false, false, null), false);
    assert.equal(ui.canSendChatComposer('Merhaba', false, false, idle()), true);
});

test('captions are trimmed, blank captions become null, and 4000 is the cap', () => {
    assert.equal(ui.normalizeChatImageUiCaption('  Ölçüm sonucu  '), 'Ölçüm sonucu');
    assert.equal(ui.normalizeChatImageUiCaption('  \n '), null);
    assert.equal(ui.isChatImageUiCaptionValid('a'.repeat(4000)), true);
    assert.equal(ui.isChatImageUiCaptionValid('a'.repeat(4001)), false);
    assert.equal(ui.canSendChatComposer('a'.repeat(4001), false, false, selected()), false);
});

test('a second send is blocked while image work is in flight', () => {
    for (const status of ['canonicalizing', 'creating-intent', 'uploading', 'finalizing']) {
        const state = selected({ status });
        assert.equal(ui.isChatImageUploadInFlight(state), true, status);
        assert.equal(ui.canSendChatComposer('', false, false, state), false, status);
    }
});

test('cancelled state has no selection but allows a new text message', () => {
    const cancelled = selected({ status: 'cancelled', source: null, previewUri: null, conversationId: null, clientMessageId: null });
    assert.equal(ui.hasChatImageSelection(cancelled), false);
    assert.equal(ui.canSendChatComposer('', false, false, cancelled), false);
    assert.equal(ui.canSendChatComposer('Yeni mesaj', false, false, cancelled), true);
});

test('upload lifecycle stages use the approved indeterminate labels', () => {
    const labels = new Map([
        ['canonicalizing', 'Görsel hazırlanıyor'],
        ['creating-intent', 'Gönderim hazırlanıyor'],
        ['uploading', 'Görsel yükleniyor'],
        ['finalizing', 'Mesaj tamamlanıyor'],
    ]);
    for (const [status, label] of labels) {
        assert.equal(ui.getChatImageUploadStatusLabel(selected({ status })), label);
    }
    assert.equal(ui.getChatImageUploadStatusLabel(selected()), null);
});

test('retry appears only for retryable failed states and never for feature_unavailable', () => {
    assert.equal(ui.shouldShowChatImageRetry(selected({ status: 'failed', error: { code: 'storage_upload_failed', userMessage: 'x', retryable: true }, retryStage: 'uploading' })), true);
    assert.equal(ui.shouldShowChatImageRetry(selected({ status: 'failed', error: { code: 'access_denied', userMessage: 'x', retryable: false }, retryStage: null })), false);
    const unavailable = selected({ status: 'failed', error: { code: 'feature_unavailable', userMessage: 'raw', retryable: true }, retryStage: 'creating-intent' });
    assert.equal(ui.shouldShowChatImageRetry(unavailable), false);
    assert.equal(ui.getChatImageUploadErrorMessage(unavailable), 'Görsel gönderme özelliği henüz kullanıma açık değil.');
});

test('image bubble uses the caption when available and falls back to Görsel', () => {
    assert.equal(ui.getChatImageBubbleLabel({ body: '  Günlük ölçüm  ', attachment: { id: 'safe' } }), 'Günlük ölçüm');
    assert.equal(ui.getChatImageBubbleLabel({ body: null, attachment: { id: 'safe' } }), 'Görsel');
    assert.equal(ui.getChatImageBubbleLabel({ body: null, attachment: null }), 'Görsel kullanılamıyor');
});

test('the success contract clears preview, source, canonical and intent', () => {
    const success = selected({ status: 'succeeded', source: null, previewUri: null, canonical: null, intent: null });
    assert.equal(ui.shouldClearChatImageComposerAfterSuccess(success), true);
    assert.equal(ui.shouldClearChatImageComposerAfterSuccess(selected()), false);
});
