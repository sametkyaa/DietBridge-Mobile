import { supabase } from '../../../lib/supabaseClient';
import {
    normalizeChatConversationRow,
    normalizeChatMessageRow,
    normalizeChatReadStateRow,
} from '../utils/chatMessageUtils';
import {
    buildConversationChannelConfig,
    buildMessageChannelConfig,
    buildReadStateChannelConfig,
} from '../utils/chatRealtimePolicy';

const createNoopSubscription = () => ({ unsubscribe: async () => undefined });

// A channel is only exposed through an idempotent cleanup function. The
// shared Supabase client owns auth/reconnect; this service never creates a
// second client or injects session/JWT data.
const createSubscriptionCleanup = (channel) => {
    let removal = null;
    return {
        unsubscribe: async () => {
            if (!removal) {
                removal = Promise.resolve(supabase.removeChannel(channel))
                    .then(() => undefined)
                    .catch(() => undefined);
            }
            return removal;
        },
    };
};

// Observes canonical conversation INSERT/UPDATE rows for one active relation.
// Raw payloads never leave this service.
export const subscribeToChatConversation = ({ relationId, onConversation, onStatus } = {}) => {
    const config = buildConversationChannelConfig(relationId);
    if (!config || typeof onConversation !== 'function') return createNoopSubscription();

    const handlePayload = (payload) => {
        const conversation = normalizeChatConversationRow(payload?.new);
        if (!conversation || conversation.relationId !== relationId) return;
        try {
            onConversation(conversation);
        } catch (error) {
            // Consumer errors must not destabilize the shared realtime channel.
        }
    };

    const channel = supabase
        .channel(config.channelName)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_conversations',
            filter: config.filter,
        }, handlePayload)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_conversations',
            filter: config.filter,
        }, handlePayload);

    channel.subscribe((status) => {
        try {
            onStatus?.(status);
        } catch (error) {
            // Status is observational; no channel replacement loop is started.
        }
    });

    return createSubscriptionCleanup(channel);
};

// Observes canonical message INSERT and UPDATE rows for the active
// conversation. UPDATE carries soft-delete tombstones and replaces the
// existing message by id in the ViewModel.
// Legacy rows are discarded by normalizeChatMessageRow because they lack a
// canonical conversation_id/body shape.
export const subscribeToChatMessages = ({ conversationId, currentUserId, onMessage, onStatus } = {}) => {
    const config = buildMessageChannelConfig(conversationId);
    if (!config || typeof onMessage !== 'function') return createNoopSubscription();

    const handlePayload = (payload) => {
        const message = normalizeChatMessageRow(payload?.new, currentUserId);
        if (!message || message.conversationId !== conversationId) return;
        try {
            onMessage(message);
        } catch (error) {
            // Consumer errors must not destabilize the shared realtime channel.
        }
    };

    const channel = supabase
        .channel(config.channelName)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: config.filter,
        }, handlePayload)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_messages',
            filter: config.filter,
        }, handlePayload);

    channel.subscribe((status) => {
        try {
            onStatus?.(status);
        } catch (error) {
            // Status is observational; no channel replacement loop is started.
        }
    });

    return createSubscriptionCleanup(channel);
};

// Receipt rows can be created on the first RPC call and updated afterwards.
// Both event types are normalized here; callers never receive raw payloads.
export const subscribeToChatReadStates = ({ conversationId, onReadState, onStatus } = {}) => {
    const config = buildReadStateChannelConfig(conversationId);
    if (!config || typeof onReadState !== 'function') return createNoopSubscription();

    const handlePayload = (payload) => {
        const readState = normalizeChatReadStateRow(payload?.new);
        if (!readState || readState.conversationId !== conversationId) return;
        try {
            onReadState(readState);
        } catch (error) {
            // Consumer errors must not destabilize the shared realtime channel.
        }
    };

    const channel = supabase
        .channel(config.channelName)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_read_states',
            filter: config.filter,
        }, handlePayload)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'chat_read_states',
            filter: config.filter,
        }, handlePayload);

    channel.subscribe((status) => {
        try {
            onStatus?.(status);
        } catch (error) {
            // Status is observational; no channel replacement loop is started.
        }
    });

    return createSubscriptionCleanup(channel);
};
