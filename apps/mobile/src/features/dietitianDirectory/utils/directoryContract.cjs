'use strict';

// Client-side mirror of the directory backend contract. The server enforces
// every limit; these helpers only shape data and explain results in Turkish.

const OPEN_INQUIRY_LIMIT = 3;
const INQUIRY_MESSAGE_MAX_LENGTH = 1000;
const CONNECTION_NOTE_MAX_LENGTH = 500;
const DIRECTORY_PAGE_SIZE = 20;

const SOCIAL_LINK_KEYS = Object.freeze(['instagram', 'tiktok', 'youtube', 'linkedin', 'x', 'website']);
const SOCIAL_LINK_LABELS = Object.freeze({
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    x: 'X',
    website: 'Web sitesi',
});

// Same rules as public.dietitian_social_links_valid: https only, no spaces,
// at most 200 characters and the platform's own host for known networks.
const SOCIAL_LINK_MAX_LENGTH = 200;
const SOCIAL_LINK_BASE = /^https:\/\/[^\s/?#@]+(\/\S*)?$/;
const SOCIAL_LINK_HOSTS = Object.freeze({
    instagram: /^https:\/\/(www\.)?instagram\.com\//i,
    tiktok: /^https:\/\/(www\.)?tiktok\.com\//i,
    youtube: /^https:\/\/((www|m)\.)?(youtube\.com|youtu\.be)\//i,
    linkedin: /^https:\/\/([a-z]{2,3}\.)?linkedin\.com\//i,
    x: /^https:\/\/(www\.)?(x\.com|twitter\.com)\//i,
});

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const isAllowedSocialLink = (key, url) => {
    if (!SOCIAL_LINK_KEYS.includes(key)) return false;
    const value = cleanString(url);
    if (!value || value.length > SOCIAL_LINK_MAX_LENGTH || !SOCIAL_LINK_BASE.test(value)) return false;
    const host = SOCIAL_LINK_HOSTS[key];
    return host ? host.test(value) : true;
};

const normalizeSocialLinks = (input) => {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return [];
    return SOCIAL_LINK_KEYS
        .filter((key) => isAllowedSocialLink(key, input[key]))
        .map((key) => ({ key, label: SOCIAL_LINK_LABELS[key], url: cleanString(input[key]) }));
};

const splitSpecializations = (value) => cleanString(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

const toWholeNumber = (value) => {
    const number = Number(value);
    return value !== null && value !== undefined && value !== '' && Number.isInteger(number) && number >= 0 ? number : null;
};

const normalizePublicDietitian = (row) => {
    if (!row || typeof row !== 'object' || !cleanString(row.id)) return null;
    return {
        id: cleanString(row.id),
        name: cleanString(row.display_name) || 'Diyetisyen',
        specializations: splitSpecializations(row.specialization),
        experienceYears: toWholeNumber(row.experience_years),
        university: cleanString(row.university),
        graduationYear: toWholeNumber(row.graduation_year),
        bio: cleanString(row.bio),
        socialLinks: normalizeSocialLinks(row.social_links),
        isListed: row.is_listed !== false,
        avatarUrl: null,
    };
};

const normalizeInquiry = (row) => {
    if (!row || !cleanString(row.id)) return null;
    return {
        id: cleanString(row.id),
        dietitianId: cleanString(row.dietitian_id),
        dietitianName: cleanString(row.counterpart_name) || 'Diyetisyen',
        status: ['open', 'closed', 'connected'].includes(row.status) ? row.status : 'closed',
        closedReason: cleanString(row.closed_reason) || null,
        lastMessageAt: row.last_message_at || row.created_at || null,
        lastMessageBody: cleanString(row.last_message_body),
        lastMessageIsOwn: Boolean(row.last_message_sender_id) && row.last_message_sender_id === row.client_id,
        unreadCount: Math.max(0, Number(row.unread_count) || 0),
    };
};

const normalizeInquiryMessage = (row, userId) => {
    if (!row || !cleanString(row.id)) return null;
    return {
        id: cleanString(row.id),
        body: typeof row.body === 'string' ? row.body : '',
        createdAt: row.created_at || null,
        isOwn: Boolean(userId) && row.sender_id === userId,
        clientMessageId: row.client_message_id || null,
    };
};

const countOpenInquiries = (inquiries) => (Array.isArray(inquiries) ? inquiries.filter((item) => item?.status === 'open').length : 0);

// The profile screen decides which call-to-action to show for a dietitian.
const getInquiryActionState = ({ inquiries, dietitianId }) => {
    const existing = (inquiries || []).find((item) => item?.dietitianId === dietitianId) || null;
    if (existing?.status === 'open') return { kind: 'open', inquiry: existing };
    if (existing && (existing.status === 'connected' || existing.closedReason === 'dietitian')) return { kind: 'closed', inquiry: existing };
    if (countOpenInquiries(inquiries) >= OPEN_INQUIRY_LIMIT) return { kind: 'limit', inquiry: existing };
    return { kind: 'new', inquiry: existing };
};

const getConnectionRequestActionState = ({ pendingRequest, dietitianId }) => {
    if (!pendingRequest) return 'available';
    return pendingRequest.dietitianId === dietitianId ? 'pending_here' : 'pending_elsewhere';
};

const INQUIRY_RESULT_MESSAGES = Object.freeze({
    limit_reached: `Aynı anda en fazla ${OPEN_INQUIRY_LIMIT} diyetisyenle ön görüşme yapabilirsin. Yeni bir diyetisyene yazmak için açık görüşmelerinden birini kapat.`,
    closed: 'Bu ön görüşme kapandı. Yeni mesaj gönderilemez.',
    not_found: 'Bu diyetisyen şu anda yeni mesaj kabul etmiyor.',
    has_dietitian: 'Zaten bir diyetisyene bağlısın. Diyetisyeninle Sohbet sekmesinden konuşabilirsin.',
    rate_limited: 'Kısa sürede çok fazla mesaj gönderdin. Lütfen biraz sonra tekrar dene.',
    invalid: `Mesaj 1 ile ${INQUIRY_MESSAGE_MAX_LENGTH} karakter arasında olmalı.`,
});

const CONNECTION_REQUEST_RESULT_MESSAGES = Object.freeze({
    sent: 'Bağlanma isteğin gönderildi. Diyetisyen kabul ettiğinde uygulamanın tamamı açılır.',
    already_pending: 'Bu diyetisyene zaten bağlanma isteği gönderdin.',
    has_pending: 'Bekleyen bir bağlanma isteğin var. Yeni istek göndermek için önce onu iptal et.',
    has_dietitian: 'Zaten bir diyetisyene bağlısın.',
    dietitian_invited: 'Bu diyetisyen sana zaten bağlantı isteği göndermiş. Diyetisyenler sekmesinden kabul edebilirsin.',
    not_found: 'Bu diyetisyen şu anda yeni bağlanma isteği kabul etmiyor.',
    invalid: `Not en fazla ${CONNECTION_NOTE_MAX_LENGTH} karakter olabilir.`,
});

const GENERIC_ERROR_MESSAGE = 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';

const CLOSED_INQUIRY_COPY = Object.freeze({
    client: 'Bu ön görüşmeyi kapattın.',
    dietitian: 'Diyetisyen bu ön görüşmeyi kapattı.',
    connected_elsewhere: 'Başka bir diyetisyene bağlandığın için bu ön görüşme kapandı.',
    connected: 'Bu diyetisyene bağlandın. Sohbete Sohbet sekmesinden devam edebilirsin.',
});

const getClosedInquiryCopy = (inquiry) => {
    if (!inquiry || inquiry.status === 'open') return null;
    if (inquiry.status === 'connected') return CLOSED_INQUIRY_COPY.connected;
    return CLOSED_INQUIRY_COPY[inquiry.closedReason] || 'Bu ön görüşme kapandı.';
};

const validateInquiryDraft = (draft) => {
    const length = Array.from(cleanString(draft)).length;
    if (length === 0) return 'empty';
    if (Array.from(String(draft || '')).length > INQUIRY_MESSAGE_MAX_LENGTH) return 'too_long';
    return null;
};

// The directory is shown only after a successful connection read says the
// client has no active dietitian. Before the first read, today's tabs stay.
// A failed read keeps whichever mode was already showing, so a network blip
// never moves a connected client out of their tabs or the reverse.
const resolveAppMode = ({ hasLoadedConnection, hasConnectionLoadError, hasActiveDietitian, previousMode = 'full' } = {}) => {
    if (hasLoadedConnection !== true) return 'full';
    if (hasConnectionLoadError === true) return previousMode === 'directory' ? 'directory' : 'full';
    return hasActiveDietitian === true ? 'full' : 'directory';
};

module.exports = {
    OPEN_INQUIRY_LIMIT,
    INQUIRY_MESSAGE_MAX_LENGTH,
    CONNECTION_NOTE_MAX_LENGTH,
    DIRECTORY_PAGE_SIZE,
    SOCIAL_LINK_KEYS,
    SOCIAL_LINK_LABELS,
    INQUIRY_RESULT_MESSAGES,
    CONNECTION_REQUEST_RESULT_MESSAGES,
    GENERIC_ERROR_MESSAGE,
    isAllowedSocialLink,
    normalizeSocialLinks,
    normalizePublicDietitian,
    normalizeInquiry,
    normalizeInquiryMessage,
    countOpenInquiries,
    getInquiryActionState,
    getConnectionRequestActionState,
    getClosedInquiryCopy,
    validateInquiryDraft,
    resolveAppMode,
};
