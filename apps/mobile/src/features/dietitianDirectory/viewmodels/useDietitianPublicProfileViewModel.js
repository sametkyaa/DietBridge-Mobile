import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicDietitian, getPublicDietitianAvatarUrls, sendConnectionRequest } from '../services/dietitianDirectoryService';
import {
    CONNECTION_NOTE_MAX_LENGTH,
    CONNECTION_REQUEST_RESULT_MESSAGES,
    GENERIC_ERROR_MESSAGE,
    getConnectionRequestActionState,
    getInquiryActionState,
} from '../utils/directoryContract.cjs';
import { useDietitianDirectory } from '../context/DietitianDirectoryContext';

export function useDietitianPublicProfileViewModel({ dietitianId, initialDietitian = null }) {
    const directory = useDietitianDirectory();
    const [dietitian, setDietitian] = useState(initialDietitian);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState(null);
    const [isRequestSheetVisible, setIsRequestSheetVisible] = useState(false);
    const [note, setNote] = useState('');
    const [isSendingRequest, setIsSendingRequest] = useState(false);
    const [requestMessage, setRequestMessage] = useState(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const load = useCallback(async () => {
        if (!dietitianId) {
            setStatus('missing');
            return;
        }
        setStatus((current) => (current === 'ready' ? current : 'loading'));
        try {
            const [profile, avatars] = await Promise.all([
                getPublicDietitian(dietitianId),
                getPublicDietitianAvatarUrls([dietitianId]),
            ]);
            if (!mountedRef.current) return;
            if (!profile) {
                setStatus('missing');
                return;
            }
            setDietitian({ ...profile, avatarUrl: avatars[profile.id] || null });
            setError(null);
            setStatus('ready');
        } catch (nextError) {
            if (!mountedRef.current) return;
            setError(nextError?.message || GENERIC_ERROR_MESSAGE);
            setStatus('error');
        }
    }, [dietitianId]);

    useEffect(() => { void load(); }, [load]);

    const inquiryState = getInquiryActionState({ inquiries: directory.inquiries, dietitianId });
    const requestState = getConnectionRequestActionState({ pendingRequest: directory.pendingRequest, dietitianId });

    const submitRequest = useCallback(async () => {
        if (isSendingRequest) return;
        if (Array.from(note.trim()).length > CONNECTION_NOTE_MAX_LENGTH) {
            setRequestMessage({ variant: 'error', text: CONNECTION_REQUEST_RESULT_MESSAGES.invalid });
            return;
        }
        setIsSendingRequest(true);
        setRequestMessage(null);
        try {
            const { result } = await sendConnectionRequest({ dietitianId, note });
            if (!mountedRef.current) return;
            const text = CONNECTION_REQUEST_RESULT_MESSAGES[result] || GENERIC_ERROR_MESSAGE;
            const success = result === 'sent' || result === 'already_pending';
            setRequestMessage({ variant: success ? 'success' : 'error', text });
            if (success) {
                setIsRequestSheetVisible(false);
                setNote('');
            }
            await directory.refresh({ silent: true });
        } catch (nextError) {
            if (mountedRef.current) setRequestMessage({ variant: 'error', text: nextError?.message || GENERIC_ERROR_MESSAGE });
        } finally {
            if (mountedRef.current) setIsSendingRequest(false);
        }
    }, [dietitianId, directory, isSendingRequest, note]);

    const cancelRequest = useCallback(async () => {
        setRequestMessage(null);
        try {
            await directory.cancelPendingRequest();
            if (mountedRef.current) setRequestMessage({ variant: 'info', text: 'Bağlanma isteğin iptal edildi.' });
        } catch (nextError) {
            if (mountedRef.current) setRequestMessage({ variant: 'error', text: nextError?.message || GENERIC_ERROR_MESSAGE });
        }
    }, [directory]);

    return {
        dietitian,
        status,
        error,
        retry: load,
        inquiryState,
        requestState,
        pendingRequest: directory.pendingRequest,
        isCancellingRequest: directory.isCancellingRequest,
        isRequestSheetVisible,
        openRequestSheet: () => { setRequestMessage(null); setIsRequestSheetVisible(true); },
        closeRequestSheet: () => { if (!isSendingRequest) setIsRequestSheetVisible(false); },
        note,
        setNote,
        isSendingRequest,
        submitRequest,
        cancelRequest,
        requestMessage,
        dismissRequestMessage: () => setRequestMessage(null),
    };
}

export default useDietitianPublicProfileViewModel;
