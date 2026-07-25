import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
    approveDietitianConnectionRequest,
    CONNECTION_GENERIC_ERROR_MESSAGE,
    getDietitianConnectionStatus,
    rejectDietitianConnectionRequest,
    subscribeDietitianConnectionChanges,
} from '../services/dietitianConnectionService';

const EMPTY_CONNECTION_STATE = {
    connectionStatus: 'none',
    activeConnection: null,
    activeDietitian: null,
    pendingRequest: null,
    hasActiveDietitian: false,
};

const defaultContext = {
    ...EMPTY_CONNECTION_STATE,
    isLoadingConnection: false,
    connectionAction: null,
    connectionError: null,
    refreshConnectionStatus: async () => EMPTY_CONNECTION_STATE,
    approvePendingRequest: async () => EMPTY_CONNECTION_STATE,
    rejectPendingRequest: async () => EMPTY_CONNECTION_STATE,
};

const DietitianConnectionContext = createContext(defaultContext);
const normalizeErrorMessage = (error) => error?.message || CONNECTION_GENERIC_ERROR_MESSAGE;

export const DietitianConnectionProvider = ({ children, userId }) => {
    const [connectionState, setConnectionState] = useState(EMPTY_CONNECTION_STATE);
    const [isLoadingConnection, setIsLoadingConnection] = useState(false);
    const [connectionAction, setConnectionAction] = useState(null);
    const [connectionError, setConnectionError] = useState(null);
    const isMountedRef = useRef(true);
    const inFlightRefreshRef = useRef(null);
    const actionLockRef = useRef(false);
    const refreshTimerRef = useRef(null);

    const resetConnectionState = useCallback(() => {
        if (!isMountedRef.current) return;
        setConnectionState(EMPTY_CONNECTION_STATE);
        setConnectionError(null);
        setIsLoadingConnection(false);
        setConnectionAction(null);
    }, []);

    const refreshConnectionStatus = useCallback(async () => {
        if (!userId) {
            resetConnectionState();
            return EMPTY_CONNECTION_STATE;
        }
        if (inFlightRefreshRef.current) return inFlightRefreshRef.current;

        const request = (async () => {
            if (isMountedRef.current) {
                setIsLoadingConnection(true);
                setConnectionError(null);
            }
            try {
                const nextState = await getDietitianConnectionStatus();
                if (isMountedRef.current) setConnectionState(nextState);
                return nextState;
            } catch (error) {
                const message = normalizeErrorMessage(error);
                if (isMountedRef.current) {
                    setConnectionError(message);
                    setConnectionState(EMPTY_CONNECTION_STATE);
                }
                return { ...EMPTY_CONNECTION_STATE, error: message };
            } finally {
                if (isMountedRef.current) setIsLoadingConnection(false);
                if (inFlightRefreshRef.current === request) inFlightRefreshRef.current = null;
            }
        })();
        inFlightRefreshRef.current = request;
        return request;
    }, [resetConnectionState, userId]);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    useEffect(() => {
        actionLockRef.current = false;
        inFlightRefreshRef.current = null;
        refreshConnectionStatus();
    }, [refreshConnectionStatus, userId]);

    useEffect(() => {
        if (!userId) return undefined;
        const scheduleRefresh = () => {
            if (refreshTimerRef.current) return;
            refreshTimerRef.current = setTimeout(() => {
                refreshTimerRef.current = null;
                refreshConnectionStatus();
            }, 150);
        };
        const unsubscribe = subscribeDietitianConnectionChanges({ clientId: userId, onChange: scheduleRefresh });
        const appStateSubscription = AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') scheduleRefresh();
        });
        return () => {
            unsubscribe();
            appStateSubscription.remove();
            if (refreshTimerRef.current) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
        };
    }, [refreshConnectionStatus, userId]);

    const runPendingAction = useCallback(async (requestId, action, execute) => {
        if (!requestId || actionLockRef.current) throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);

        actionLockRef.current = true;
        if (isMountedRef.current) {
            setConnectionAction(action);
            setConnectionError(null);
        }
        try {
            await execute(requestId);
            return await refreshConnectionStatus();
        } catch (error) {
            const message = normalizeErrorMessage(error);
            if (isMountedRef.current) setConnectionError(message);
            throw new Error(message);
        } finally {
            actionLockRef.current = false;
            if (isMountedRef.current) setConnectionAction(null);
        }
    }, [refreshConnectionStatus]);

    const approvePendingRequest = useCallback(
        (requestId) => runPendingAction(requestId, 'approving', approveDietitianConnectionRequest),
        [runPendingAction],
    );
    const rejectPendingRequest = useCallback(
        (requestId) => runPendingAction(requestId, 'rejecting', rejectDietitianConnectionRequest),
        [runPendingAction],
    );

    const value = useMemo(() => ({
        ...connectionState,
        isLoadingConnection,
        connectionAction,
        connectionError,
        refreshConnectionStatus,
        approvePendingRequest,
        rejectPendingRequest,
    }), [
        approvePendingRequest, connectionAction, connectionError, connectionState,
        isLoadingConnection, refreshConnectionStatus, rejectPendingRequest,
    ]);

    return <DietitianConnectionContext.Provider value={value}>{children}</DietitianConnectionContext.Provider>;
};

export const useDietitianConnection = () => useContext(DietitianConnectionContext);
