const INVITE_MESSAGES = {
    not_found: 'Kod bulunamadı. Diyetisyeninizden kodu kontrol etmesini isteyin.',
    closed: 'Bu kod şu anda yeni bağlantı kabul etmiyor.',
    rate_limited: 'Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.',
    already_connected: 'Bu diyetisyene zaten bağlısınız.',
    has_other_dietitian: 'Önce mevcut diyetisyeninizden ayrılmanız gerekiyor.',
    limit_reached: 'Diyetisyeninizin danışan kontenjanı şu anda dolu.',
    error: 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
};
const normalizeInviteCode = (value) => {
    if (typeof value !== 'string' || value.length > 64 || !/^[a-z0-9\s-]+$/i.test(value)) return null;
    const code = value.replace(/[\s-]/g, '').toUpperCase();
    return /^DB[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{16}$/.test(code) ? code : null;
};
const parseInviteLink = (value) => {
    try {
        const url = new URL(value);
        if (url.search || url.hash || url.username || url.password || url.port) return null;
        let path;
        if (url.protocol === 'https:' && url.hostname === 'app.dietbridge.com.tr') path = url.pathname;
        else if (url.protocol === 'dietbridge:' && url.hostname === 'davet') path = `/davet${url.pathname}`;
        else return null;
        const match = /^\/davet\/([^/]+)\/?$/.exec(path);
        return match ? normalizeInviteCode(decodeURIComponent(match[1])) : null;
    } catch { return null; }
};
module.exports = { INVITE_MESSAGES, normalizeInviteCode, parseInviteLink };
