const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const policy = require('../chatMediaPolicy');
const utils = require('../chatMessageUtils');
const constants = require('../../constants/chatConstants');
const C = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const M = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const U = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const row = () => ({
    id: M, conversation_id: C, sender_id: U, client_message_id: M,
    body: null, message_kind: 'file', created_at: '2026-10-12T08:00:00Z', deleted_at: null, deleted_by: null,
    attachment: { id: U, message_id: M, bucket_id: 'chat-media', object_path: `pending/${C}/${U}.pdf`,
        mime_type: 'application/pdf', byte_size: 100, width: 0, height: 0, deleted_at: null },
});
const load = (name, imports) => {
    const file = path.join(__dirname, '../../services', name);
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        fileName: name, compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    const module = { exports: {} };
    vm.runInNewContext(compiled, { module, exports: module.exports, require: imports }, { filename: file });
    return module.exports;
};
const harness = (rows, metadataError = null) => {
    const tables = [];
    const supabase = { from: (table) => {
        tables.push(table);
        const query = {};
        for (const name of ['select', 'eq', 'not', 'or', 'order', 'limit', 'in']) query[name] = () => query;
        query.then = (resolve, reject) => Promise.resolve({
            data: table === 'chat_attachments' ? [{ message_id: M, file_name: 'Haftalık beslenme planı.pdf' }] : rows,
            error: table === 'chat_attachments' ? metadataError : null,
        }).then(resolve, reject);
        return query;
    } };
    const media = load('chatMediaService.js', (name) => {
        if (name.endsWith('supabaseClient')) return { supabase };
        if (name.endsWith('chatMediaPolicy')) return policy;
        if (name.endsWith('chatMessageUtils')) return utils;
        return {};
    });
    const chat = load('chatService.js', (name) => {
        if (name.endsWith('supabaseClient')) return { supabase };
        if (name.endsWith('chatMediaService')) return media;
        if (name.endsWith('chatMessageUtils')) return utils;
        if (name.endsWith('chatConstants')) return constants;
        if (name.endsWith('healthConsentService')) return { requireHealthSharingConsent: async () => {} };
        throw new Error(`Unexpected dependency: ${name}`);
    });
    return { chat, tables };
};
test('reopened and paginated mobile chat retains the real document filename', async () => {
    const h = harness([row()]);
    const page = await h.chat.fetchChatMessagesPage({ conversationId: C, currentUserId: U });
    assert.equal(page.messages.length, 1);
    assert.equal(page.messages[0].attachment.fileName, 'Haftalık beslenme planı.pdf');
    assert.deepEqual(h.tables, ['chat_messages', 'chat_attachments']);
});
test('text history remains readable without the new media metadata query', async () => {
    const h = harness([{ ...row(), message_kind: 'text', body: 'Merhaba', attachment: null }]);
    const page = await h.chat.fetchChatMessagesPage({ conversationId: C, currentUserId: U });
    assert.equal(page.messages[0].body, 'Merhaba');
    assert.deepEqual(h.tables, ['chat_messages']);
});
test('media metadata read failure does not present a complete successful history', async () => {
    const h = harness([row()], { code: '42501' });
    await assert.rejects(h.chat.fetchChatMessagesPage({ conversationId: C, currentUserId: U }));
});
