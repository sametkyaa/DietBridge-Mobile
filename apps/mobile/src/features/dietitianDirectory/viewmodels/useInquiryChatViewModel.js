import { useCallback, useEffect, useRef, useState } from 'react';
import {
    closeInquiry,
    createClientMessageId,
    listInquiryMessages,
    markInquiryRead,
    sendInquiryMessage,
    startInquiry,
    subscribeInquiryMessages,
} from '../services/dietitianDirectoryService';
import {
    GENERIC_ERROR_MESSAGE,
    INQUIRY_MESSAGE_MAX_LENGTH,
    INQUIRY_RESULT_MESSAGES,
    getClosedInquiryCopy,
    getInquiryActionState,
    validateInquiryDraft,
} from '../utils/directoryContract.cjs';
import { useDietitianDirectory } from '../context/DietitianDirectoryContext';

const SENT_RESULTS = new Set(['started', 'sent', 'duplicate']);

export function useInquiryChatViewModel({ userId, dietitianId, initialInquiryId = null }) {
    const directory = useDietitianDirectory();
    const [inquiryId, setInquiryId] = useState(initialInquiryId);
    const [messages, setMessages] = useState([]);
    const [status, setStatus] = useState(initialInquiryId ? 'loading' : 'ready');
    const [error, setError] = useState(null);
    const [draft, setDraft] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const mountedRef = useRef(true);
    // One idempotency key per draft text, so a retry after a lost response
    // never sends the same message twice.
    const pendingRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const inquiry = directory.inquiries.find((item) => item.id === inquiryId)
        || directory.inquiries.find((item) => item.dietitianId === dietitianId)
        || null;
    const actionState = getInquiryActionState({ inquiries: directory.inquiries, dietitianId });

    useEffect(() => {
        if (!inquiryId && inquiry?.id) setInquiryId(inquiry.id);
    }, [inquiry?.id, inquiryId]);

    const loadMessages = useCallback(async ({ silent = false } = {}) => {
        if (!inquiryId) return;
        if (!silent) setStatus((current) => (current === 'ready' && messages.length > 0 ? current : 'loading'));
        try {
            const next = await listInquiryMessages(inquiryId, userId);
            if (!mountedRef.current) return;
            setMessages(next);
            setError(null);
            setStatus('ready');
            void markInquiryRead(inquiryId);
        } catch (nextError) {
            if (!mountedRef.current) return;
            setError(nextError?.message || GENERIC_ERROR_MESSAGE);
            setStatus((current) => (current === 'ready' ? current : 'error'));
        }
    }, [inquiryId, messages.length, userId]);

    const loadRef = useRef(loadMessages);
    loadRef.current = loadMessages;

    useEffect(() => {
        if (!inquiryId) return undefined;
        void loadRef.current();
        return subscribeInquiryMessages({
            inquiryId,
            onChange: () => {
                void loadRef.current({ silent: true });
                void directory.refresh({ silent: true });
            },
        });
        // directory.refresh is stable for a user; re-subscribing on it would churn channels.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inquiryId]);

    const isOpen = inquiryId ? inquiry?.status === 'open' || (!inquiry && status !== 'error') : actionState.kind === 'new';
    const blockedMessage = !inquiryId && actionState.kind === 'limit'
        ? INQUIRY_RESULT_MESSAGES.limit_reached
        : getClosedInquiryCopy(inquiry);

    const send = useCallback(async () => {
        if (isSending) return;
        const validation = validateInquiryDraft(draft);
        if (validation === 'empty') return;
        if (validation === 'too_long') {
            setSendError(`Mesaj en fazla ${INQUIRY_MESSAGE_MAX_LENGTH} karakter olabilir.`);
            return;
        }
        const body = draft.trim();
        if (!pendingRef.current || pendingRef.current.body !== body) {
            pendingRef.current = { body, clientMessageId: createClientMessageId() };
        }
        const { clientMessageId } = pendingRef.current;
        setIsSending(true);
        setSendError(null);
        try {
            const response = inquiryId
                ? await sendInquiryMessage({ inquiryId, body, clientMessageId })
                : await startInquiry({ dietitianId, body, clientMessageId });
            if (!mountedRef.current) return;
            if (SENT_RESULTS.has(response.result)) {
                pendingRef.current = null;
                setDraft('');
                if (!inquiryId && response.inquiry_id) setInquiryId(response.inquiry_id);
                else void loadRef.current({ silent: true });
                void directory.refresh({ silent: true });
                return;
            }
            setSendError(INQUIRY_RESULT_MESSAGES[response.result] || GENERIC_ERROR_MESSAGE);
            if (response.result === 'closed' || response.result === 'limit_reached') void directory.refresh({ silent: true });
            if (response.result !== 'rate_limited') pendingRef.current = null;
        } catch (nextError) {
            if (mountedRef.current) setSendError(nextError?.message || GENERIC_ERROR_MESSAGE);
        } finally {
            if (mountedRef.current) setIsSending(false);
        }
    }, [dietitianId, directory, draft, inquiryId, isSending]);

    const close = useCallback(async () => {
        if (!inquiryId || isClosing) return false;
        setIsClosing(true);
        try {
            await closeInquiry(inquiryId);
            await directory.refresh({ silent: true });
            return true;
        } catch (nextError) {
            if (mountedRef.current) setSendError(nextError?.message || GENERIC_ERROR_MESSAGE);
            return false;
        } finally {
            if (mountedRef.current) setIsClosing(false);
        }
    }, [directory, inquiryId, isClosing]);

    return {
        inquiryId,
        inquiry,
        messages,
        status,
        error,
        retry: () => void loadMessages(),
        draft,
        setDraft: (value) => { setDraft(value); if (sendError) setSendError(null); },
        isSending,
        sendError,
        send,
        canSend: isOpen && !isSending && validateInquiryDraft(draft) === null,
        isOpen,
        blockedMessage: isOpen ? null : blockedMessage,
        canClose: Boolean(inquiryId) && inquiry?.status === 'open',
        isClosing,
        close,
        maxLength: INQUIRY_MESSAGE_MAX_LENGTH,
    };
}

export default useInquiryChatViewModel;
