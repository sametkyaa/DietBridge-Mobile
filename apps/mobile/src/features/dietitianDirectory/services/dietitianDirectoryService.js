import * as Crypto from 'expo-crypto';
import { supabase } from '../../../lib/supabaseClient';
import {
    DIRECTORY_PAGE_SIZE,
    GENERIC_ERROR_MESSAGE,
    normalizeInquiry,
    normalizeInquiryMessage,
    normalizePublicDietitian,
} from '../utils/directoryContract.cjs';

const AVATAR_FUNCTION = 'public-dietitian-avatars';
const MAX_AVATAR_IDS = 50;

const fail = (error) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('Dietitian directory request failed.', error?.code || '');
    throw new Error(GENERIC_ERROR_MESSAGE);
};

const resultOf = (data) => (data && typeof data === 'object' && typeof data.result === 'string' ? data : { result: 'error' });

export const createClientMessageId = () => Crypto.randomUUID();

export const listPublicDietitians = async ({ search = '', offset = 0, limit = DIRECTORY_PAGE_SIZE } = {}) => {
    const { data, error } = await supabase.rpc('list_public_dietitians', {
        p_search: search.trim() || null,
        p_limit: limit,
        p_offset: offset,
    });
    if (error) fail(error);
    return (data || []).map(normalizePublicDietitian).filter(Boolean);
};

export const getPublicDietitian = async (dietitianId) => {
    const { data, error } = await supabase.rpc('get_public_dietitian', { p_dietitian_id: dietitianId });
    if (error) fail(error);
    return normalizePublicDietitian(data);
};

// Avatars live in a private bucket; the edge function signs only the
// avatars of dietitians this client is allowed to see. Failures fall back
// to initials, so they never block the list.
export const getPublicDietitianAvatarUrls = async (dietitianIds = []) => {
    const ids = [...new Set(dietitianIds.filter(Boolean))].slice(0, MAX_AVATAR_IDS);
    if (ids.length === 0) return {};
    try {
        const { data, error } = await supabase.functions.invoke(AVATAR_FUNCTION, { body: { dietitianIds: ids } });
        if (error || data?.result !== 'ready' || !data.avatars || typeof data.avatars !== 'object') return {};
        return Object.fromEntries(Object.entries(data.avatars).filter(([, url]) => typeof url === 'string' && url.startsWith('https://')));
    } catch {
        return {};
    }
};

export const listMyInquiries = async () => {
    const { data, error } = await supabase.rpc('list_my_dietitian_inquiries');
    if (error) fail(error);
    return (data || []).map(normalizeInquiry).filter(Boolean);
};

export const listInquiryMessages = async (inquiryId, userId) => {
    const { data, error } = await supabase
        .from('dietitian_inquiry_messages')
        .select('id, sender_id, body, created_at, client_message_id')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(500);
    if (error) fail(error);
    return (data || []).map((row) => normalizeInquiryMessage(row, userId)).filter(Boolean);
};

export const startInquiry = async ({ dietitianId, body, clientMessageId }) => {
    const { data, error } = await supabase.rpc('start_dietitian_inquiry', {
        p_dietitian_id: dietitianId,
        p_body: body,
        p_client_message_id: clientMessageId,
    });
    if (error) fail(error);
    return resultOf(data);
};

export const sendInquiryMessage = async ({ inquiryId, body, clientMessageId }) => {
    const { data, error } = await supabase.rpc('send_dietitian_inquiry_message', {
        p_inquiry_id: inquiryId,
        p_body: body,
        p_client_message_id: clientMessageId,
    });
    if (error) fail(error);
    return resultOf(data);
};

export const closeInquiry = async (inquiryId) => {
    const { data, error } = await supabase.rpc('close_dietitian_inquiry', { p_inquiry_id: inquiryId });
    if (error) fail(error);
    return data;
};

export const markInquiryRead = async (inquiryId) => {
    const { error } = await supabase.rpc('mark_dietitian_inquiry_read', { p_inquiry_id: inquiryId });
    if (error && typeof __DEV__ !== 'undefined' && __DEV__) console.warn('Inquiry read mark failed.');
};

export const getMyPendingConnectionRequest = async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
        .from('dietitian_connection_requests')
        .select('id, dietitian_id, created_at')
        .eq('client_id', userId)
        .eq('status', 'pending')
        .maybeSingle();
    if (error) fail(error);
    return data ? { id: data.id, dietitianId: data.dietitian_id, createdAt: data.created_at } : null;
};

export const sendConnectionRequest = async ({ dietitianId, note }) => {
    const { data, error } = await supabase.rpc('send_dietitian_connection_request', {
        p_dietitian_id: dietitianId,
        p_note: note?.trim() || null,
    });
    if (error) fail(error);
    return resultOf(data);
};

export const cancelConnectionRequest = async (requestId) => {
    const { data, error } = await supabase.rpc('cancel_dietitian_connection_request', { p_request_id: requestId });
    if (error) fail(error);
    return data;
};

const removeChannel = (channel) => {
    try {
        supabase.removeChannel(channel);
    } catch {
        if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn('Directory realtime cleanup failed.');
    }
};

// Invalidation-only realtime, like the connection context: consumers re-read
// through the RPCs instead of trusting event payloads.
export const subscribeDirectoryChanges = ({ clientId, onChange } = {}) => {
    if (!clientId || typeof onChange !== 'function') return () => {};
    const channel = supabase
        .channel(`dietitian-directory:${clientId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dietitian_inquiries', filter: `client_id=eq.${clientId}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'dietitian_connection_requests', filter: `client_id=eq.${clientId}` }, onChange)
        .subscribe();
    return () => removeChannel(channel);
};

export const subscribeInquiryMessages = ({ inquiryId, onChange } = {}) => {
    if (!inquiryId || typeof onChange !== 'function') return () => {};
    const channel = supabase
        .channel(`dietitian-inquiry:${inquiryId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dietitian_inquiry_messages', filter: `inquiry_id=eq.${inquiryId}` }, onChange)
        .subscribe();
    return () => removeChannel(channel);
};
