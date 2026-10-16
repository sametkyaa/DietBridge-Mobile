const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const contract = require('../directoryContract.cjs');
const { formatUserError } = require('../../../../shared/utils/userError.cjs');
const policy = require('../../../../shared/utils/externalLinkPolicy.cjs');

const SRC = path.join(__dirname, '../../../..');
const read = (relative) => fs.readFileSync(path.join(SRC, relative), 'utf8');

test('app mode stays on the existing tabs until a successful read says there is no dietitian', () => {
    assert.equal(contract.resolveAppMode({}), 'full');
    assert.equal(contract.resolveAppMode({ hasLoadedConnection: false, hasActiveDietitian: false }), 'full');
    assert.equal(contract.resolveAppMode({ hasLoadedConnection: true, hasActiveDietitian: true }), 'full');
    assert.equal(contract.resolveAppMode({ hasLoadedConnection: true, hasActiveDietitian: false }), 'directory');
    // A failed read keeps whichever mode was showing.
    assert.equal(contract.resolveAppMode({ hasLoadedConnection: true, hasConnectionLoadError: true, hasActiveDietitian: false }), 'full');
    assert.equal(contract.resolveAppMode({ hasLoadedConnection: true, hasConnectionLoadError: true, hasActiveDietitian: false, previousMode: 'directory' }), 'directory');
    assert.equal(contract.resolveAppMode({ hasLoadedConnection: true, hasConnectionLoadError: true, hasActiveDietitian: false, previousMode: 'full' }), 'full');
});

test('social links follow the database rules and open only through the checked policy', async () => {
    assert.equal(contract.isAllowedSocialLink('instagram', 'https://www.instagram.com/diyetisyen'), true);
    assert.equal(contract.isAllowedSocialLink('x', 'https://twitter.com/diyetisyen'), true);
    assert.equal(contract.isAllowedSocialLink('website', 'https://ornek.com.tr'), true);
    for (const [key, url] of [
        ['instagram', 'http://instagram.com/a'],
        ['instagram', 'https://evil.com/instagram.com'],
        ['instagram', 'https://user@instagram.com/a'],
        ['linkedin', 'javascript:alert(1)'],
        ['website', `https://ornek.com/${'a'.repeat(200)}`],
        ['unknown', 'https://ornek.com'],
    ]) assert.equal(contract.isAllowedSocialLink(key, url), false, `${key} ${url}`);

    assert.deepEqual(
        contract.normalizeSocialLinks({ website: 'https://ornek.com', instagram: 'https://instagram.com/a', tiktok: 'https://youtube.com/x', other: 'https://a.com' }),
        [
            { key: 'instagram', label: 'Instagram', url: 'https://instagram.com/a' },
            { key: 'website', label: 'Web sitesi', url: 'https://ornek.com' },
        ],
    );

    const opened = [];
    const deps = { canOpenURL: async () => true, openURL: async (url) => { opened.push(url); } };
    const check = (url) => contract.isAllowedSocialLink('instagram', url);
    assert.equal(await policy.openCheckedTarget('https://instagram.com/a', check, deps), true);
    assert.equal(await policy.openCheckedTarget('https://evil.com', check, deps), false);
    assert.equal(await policy.openCheckedTarget('https://instagram.com/a', undefined, deps), false);
    assert.deepEqual(opened, ['https://instagram.com/a']);
    // Legal links keep their fixed allowlist.
    assert.equal(await policy.openExternalTarget('https://instagram.com/a', deps), false);
});

test('public dietitian rows expose only public fields with safe defaults', () => {
    const dietitian = contract.normalizePublicDietitian({
        id: 'd1', display_name: '  Ayşe Yılmaz ', specialization: 'Sporcu beslenmesi, Diyabet, ',
        experience_years: 7, university: 'Hacettepe', bio: 'Merhaba', social_links: { instagram: 'https://instagram.com/a' },
        email: 'gizli@ornek.com', phone: '555',
    });
    assert.equal(dietitian.name, 'Ayşe Yılmaz');
    assert.deepEqual(dietitian.specializations, ['Sporcu beslenmesi', 'Diyabet']);
    assert.equal(dietitian.experienceYears, 7);
    assert.equal(dietitian.isListed, true);
    assert.equal('email' in dietitian || 'phone' in dietitian, false);
    assert.equal(contract.normalizePublicDietitian(null), null);
    assert.equal(contract.normalizePublicDietitian({ id: 'd2', experience_years: -1 }).experienceYears, null);
});

test('inquiry action state enforces the three open inquiry rule and one-way closes', () => {
    const open = (id, dietitianId) => ({ id, dietitianId, status: 'open', closedReason: null });
    const three = [open('i1', 'a'), open('i2', 'b'), open('i3', 'c')];
    assert.equal(contract.OPEN_INQUIRY_LIMIT, 3);
    assert.equal(contract.getInquiryActionState({ inquiries: three, dietitianId: 'a' }).kind, 'open');
    assert.equal(contract.getInquiryActionState({ inquiries: three, dietitianId: 'd' }).kind, 'limit');
    assert.equal(contract.getInquiryActionState({ inquiries: three.slice(0, 2), dietitianId: 'd' }).kind, 'new');
    const closedByClient = { id: 'i4', dietitianId: 'd', status: 'closed', closedReason: 'client' };
    assert.equal(contract.getInquiryActionState({ inquiries: [closedByClient], dietitianId: 'd' }).kind, 'new');
    const closedByDietitian = { ...closedByClient, closedReason: 'dietitian' };
    assert.equal(contract.getInquiryActionState({ inquiries: [closedByDietitian], dietitianId: 'd' }).kind, 'closed');
    assert.equal(contract.getInquiryActionState({ inquiries: [{ ...closedByClient, status: 'connected' }], dietitianId: 'd' }).kind, 'closed');
});

test('only one pending connection request is offered at a time', () => {
    assert.equal(contract.getConnectionRequestActionState({ pendingRequest: null, dietitianId: 'a' }), 'available');
    assert.equal(contract.getConnectionRequestActionState({ pendingRequest: { dietitianId: 'a' }, dietitianId: 'a' }), 'pending_here');
    assert.equal(contract.getConnectionRequestActionState({ pendingRequest: { dietitianId: 'a' }, dietitianId: 'b' }), 'pending_elsewhere');
});

test('inquiry rows and messages are normalized for the signed-in client', () => {
    const inquiry = contract.normalizeInquiry({
        id: 'i1', client_id: 'u1', dietitian_id: 'd1', counterpart_name: 'Ayşe', status: 'weird',
        last_message_sender_id: 'u1', last_message_body: 'Merhaba', unread_count: '2', created_at: '2026-10-16T10:00:00Z',
    });
    assert.equal(inquiry.status, 'closed');
    assert.equal(inquiry.lastMessageIsOwn, true);
    assert.equal(inquiry.unreadCount, 2);
    assert.equal(inquiry.lastMessageAt, '2026-10-16T10:00:00Z');
    assert.equal(contract.normalizeInquiryMessage({ id: 'm1', sender_id: 'u1', body: 'Selam' }, 'u1').isOwn, true);
    assert.equal(contract.normalizeInquiryMessage({ id: 'm2', sender_id: 'd1', body: 'Selam' }, 'u1').isOwn, false);
    assert.equal(contract.getClosedInquiryCopy({ status: 'open' }), null);
    assert.match(contract.getClosedInquiryCopy({ status: 'connected' }), /bağlandın/);
    assert.match(contract.getClosedInquiryCopy({ status: 'closed', closedReason: 'connected_elsewhere' }), /Başka bir diyetisyene/);
});

test('drafts are validated against the 1000 character limit', () => {
    assert.equal(contract.validateInquiryDraft('   '), 'empty');
    assert.equal(contract.validateInquiryDraft('Merhaba'), null);
    assert.equal(contract.validateInquiryDraft('a'.repeat(1000)), null);
    assert.equal(contract.validateInquiryDraft('a'.repeat(1001)), 'too_long');
});

test('every directory error message is a reviewed catalog message', () => {
    const messages = [
        ...Object.values(contract.INQUIRY_RESULT_MESSAGES),
        ...Object.entries(contract.CONNECTION_REQUEST_RESULT_MESSAGES).filter(([key]) => key !== 'sent').map(([, value]) => value),
        contract.GENERIC_ERROR_MESSAGE,
        `Mesaj en fazla ${contract.INQUIRY_MESSAGE_MAX_LENGTH} karakter olabilir.`,
    ];
    for (const message of messages) assert.equal(formatUserError(message), message);
});

test('connected clients keep the existing tabs and screens unchanged', () => {
    const mainTabs = read('navigation/MainTabs.js');
    const names = [...mainTabs.matchAll(/name="([^"]+)"\s+component={(\w+)}/g)].map((match) => `${match[1]}:${match[2]}`);
    assert.deepEqual(names, ['Ana Sayfa:DashboardScreen', 'Öğünler:MealsScreen', 'Analiz:AnalysisScreen', 'Sohbet:ChatScreen']);

    const root = read('navigation/RootNavigator.js');
    assert.match(root, /<Stack.Screen name="MainTabs">/);
    assert.match(root, /<HomeTabs \{\.\.\.props\} mode=\{appMode\} \/>/);
    for (const screen of ['OnboardingSetup', 'Profile', 'Appointments', 'AppointmentDetail', 'NotificationCenter', 'GroceryList', 'Settings', 'Support']) {
        assert.match(root, new RegExp(`name="${screen}"`), screen);
    }
    const home = read('navigation/HomeTabs.js');
    assert.match(home, /mode === 'directory' \? <DirectoryTabs \/> : <MainTabs \/>/);
    assert.match(home, /resolveAppMode\(/);
});

test('directory tabs show only dietitians, messages and profile', () => {
    const tabs = read('navigation/DirectoryTabs.js');
    const names = [...tabs.matchAll(/name="([^"]+)"\s+component={(\w+)}/g)].map((match) => `${match[1]}:${match[2]}`);
    assert.deepEqual(names, ['Diyetisyenler:DietitianDirectoryScreen', 'Mesajlar:InquiryListScreen', 'Profil:ProfileScreen']);
    assert.doesNotMatch(tabs, /MealsScreen|AnalysisScreen|DashboardScreen|ChatScreen/);
});

test('directory data access stays in the service layer and the old chat is untouched', () => {
    const dir = path.join(SRC, 'features/dietitianDirectory');
    const files = ['context', 'screens', 'viewmodels', 'components'].flatMap((folder) => fs.readdirSync(path.join(dir, folder)).map((name) => path.join(dir, folder, name)));
    for (const file of files) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /supabaseClient|supabase\./, path.basename(file));
    const service = read('features/dietitianDirectory/services/dietitianDirectoryService.js');
    assert.doesNotMatch(service, /send_chat_message|chat_messages|chat_conversations|dietitian_clients/);
    assert.match(service, /functions\.invoke\(AVATAR_FUNCTION/);
    assert.match(read('features/dietitianDirectory/screens/InquiryChatScreen.js'), /Bu diyetisyene henüz bağlı değilsin\. Sağlık bilgilerini paylaşırken dikkatli ol\./);
    assert.match(read('features/dietitianDirectory/screens/DietitianPublicProfileScreen.js'), /openCheckedExternalLink\(link\.url, \(url\) => isAllowedSocialLink\(link\.key, url\)\)/);
});

test('onboarding keeps the invite code path and adds the find-dietitian option', () => {
    const step = read('features/onboarding/components/OnboardingConnectStep.js');
    assert.match(step, /label="Kodu kontrol et"/);
    assert.match(step, /label="Diyetisyenim yok, diyetisyen bul"/);
});
