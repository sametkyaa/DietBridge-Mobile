import { supabase } from '../../../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INVITE_MESSAGES, normalizeInviteCode } from '../utils/inviteCodeContract.cjs';

const PENDING_KEY = 'dietbridge.pending-invite-code.v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const readPendingInviteCode = async () => normalizeInviteCode(await AsyncStorage.getItem(PENDING_KEY));
export const storePendingInviteCode = async (code) => {
    const normalized = normalizeInviteCode(code);
    if (!normalized) throw new Error(INVITE_MESSAGES.not_found);
    // Only a public invite code is persisted; no profile, token or health data.
    await AsyncStorage.setItem(PENDING_KEY, normalized);
};
export const clearPendingInviteCode = () => AsyncStorage.removeItem(PENDING_KEY);

const assertActor = async (expectedUserId) => {
    const { data: restored, error: sessionError } = await supabase.auth.getSession();
    const token = restored.session?.access_token;
    if (sessionError || !token) throw new Error(INVITE_MESSAGES.error);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !expectedUserId || data.user?.id !== expectedUserId) throw new Error(INVITE_MESSAGES.error);
    return `Bearer ${token}`;
};
export const previewInviteCode = async (code, userId) => {
    const normalized = normalizeInviteCode(code);
    if (!normalized) return { result: 'not_found' };
    const authorization = await assertActor(userId);
    const { data, error } = await supabase.functions.invoke('preview-dietitian-invite', { body: { code: normalized }, headers: { Authorization: authorization } });
    if (error || !data) throw new Error(INVITE_MESSAGES.error);
    if (data.result !== 'ready') {
        if (!['not_found', 'closed', 'rate_limited'].includes(data.result)) throw new Error(INVITE_MESSAGES.error);
        return { result: data.result };
    }
    const profile = data.dietitian;
    if (!UUID.test(profile?.id) || (profile.display_name !== null && typeof profile.display_name !== 'string')
        || typeof profile.professional_title !== 'string' || (profile.avatar_url !== null && typeof profile.avatar_url !== 'string')) throw new Error(INVITE_MESSAGES.error);
    return { result: 'ready', dietitian: { id: profile.id, name: profile.display_name || 'Diyetisyen', title: profile.professional_title, avatarUrl: profile.avatar_url } };
};
export const redeemInviteCode = async (code, userId) => {
    const normalized = normalizeInviteCode(code);
    if (!normalized) return 'not_found';
    const authorization = await assertActor(userId);
    const { data, error } = await supabase.rpc('redeem_dietitian_invite_code', { p_code: normalized }).setHeader('Authorization', authorization);
    if (error || !['connected', 'already_connected', 'not_found', 'closed', 'has_other_dietitian', 'limit_reached', 'rate_limited'].includes(data)) throw new Error(INVITE_MESSAGES.error);
    return data;
};
export const leaveDietitian = async (userId) => {
    const authorization = await assertActor(userId);
    const { data, error } = await supabase.rpc('leave_my_dietitian').setHeader('Authorization', authorization);
    if (error || !['left', 'not_connected'].includes(data)) throw new Error(INVITE_MESSAGES.error);
    return data;
};
