import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
    cancelConnectionRequest,
    getMyPendingConnectionRequest,
    listMyInquiries,
    subscribeDirectoryChanges,
} from '../services/dietitianDirectoryService';
import { countOpenInquiries, GENERIC_ERROR_MESSAGE } from '../utils/directoryContract.cjs';

const defaultContext = {
    enabled: false,
    status: 'idle',
    error: null,
    inquiries: [],
    openInquiryCount: 0,
    unreadCount: 0,
    pendingRequest: null,
    isCancellingRequest: false,
    refresh: async () => {},
    cancelPendingRequest: async () => false,
};

const DietitianDirectoryContext = createContext(defaultContext);

// Shared inquiry and request state for the directory tabs and the stack
// screens they open. It only runs while the client has no dietitian.
export const DietitianDirectoryProvider = ({ children, userId, enabled }) => {
    const [status, setStatus] = useState('idle');
    const [error, setError] = useState(null);
    const [inquiries, setInquiries] = useState([]);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [isCancellingRequest, setIsCancellingRequest] = useState(false);
    const mountedRef = useRef(true);
    const inFlightRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const refresh = useCallback(async ({ silent = false } = {}) => {
        if (!enabled || !userId) return;
        if (inFlightRef.current) return inFlightRef.current;
        const request = (async () => {
            if (!silent && mountedRef.current) setStatus((current) => (current === 'ready' ? current : 'loading'));
            try {
                const [nextInquiries, nextRequest] = await Promise.all([
                    listMyInquiries(),
                    getMyPendingConnectionRequest(userId),
                ]);
                if (!mountedRef.current) return;
                setInquiries(nextInquiries);
                setPendingRequest(nextRequest);
                setError(null);
                setStatus('ready');
            } catch (nextError) {
                if (!mountedRef.current) return;
                setError(nextError?.message || GENERIC_ERROR_MESSAGE);
                setStatus((current) => (current === 'ready' ? current : 'error'));
            } finally {
                inFlightRef.current = null;
            }
        })();
        inFlightRef.current = request;
        return request;
    }, [enabled, userId]);

    useEffect(() => {
        if (!enabled || !userId) {
            setStatus('idle');
            setError(null);
            setInquiries([]);
            setPendingRequest(null);
            return undefined;
        }
        refresh();
        const schedule = () => {
            if (timerRef.current) return;
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                refresh({ silent: true });
            }, 200);
        };
        const unsubscribe = subscribeDirectoryChanges({ clientId: userId, onChange: schedule });
        const appState = AppState.addEventListener('change', (next) => { if (next === 'active') schedule(); });
        return () => {
            unsubscribe();
            appState.remove();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [enabled, refresh, userId]);

    const cancelPendingRequest = useCallback(async () => {
        if (!pendingRequest || isCancellingRequest) return false;
        setIsCancellingRequest(true);
        try {
            await cancelConnectionRequest(pendingRequest.id);
            await refresh({ silent: true });
            return true;
        } finally {
            if (mountedRef.current) setIsCancellingRequest(false);
        }
    }, [isCancellingRequest, pendingRequest, refresh]);

    const value = useMemo(() => ({
        enabled: Boolean(enabled),
        status,
        error,
        inquiries,
        openInquiryCount: countOpenInquiries(inquiries),
        unreadCount: inquiries.reduce((total, item) => total + item.unreadCount, 0),
        pendingRequest,
        isCancellingRequest,
        refresh,
        cancelPendingRequest,
    }), [cancelPendingRequest, enabled, error, inquiries, isCancellingRequest, pendingRequest, refresh, status]);

    return <DietitianDirectoryContext.Provider value={value}>{children}</DietitianDirectoryContext.Provider>;
};

export const useDietitianDirectory = () => useContext(DietitianDirectoryContext);
