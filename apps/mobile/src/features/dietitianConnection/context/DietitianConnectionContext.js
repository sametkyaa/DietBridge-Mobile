import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    approveDietitianConnectionRequest,
    CONNECTION_GENERIC_ERROR_MESSAGE,
    getDietitianConnectionStatus,
    rejectDietitianConnectionRequest,
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

    const resetConnectionState = useCallback(() => {
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

        setIsLoadingConnection(true);
        setConnectionError(null);
        try {
            const nextState = await getDietitianConnectionStatus();
            setConnectionState(nextState);
            return nextState;
        } catch (error) {
            const message = normalizeErrorMessage(error);
            setConnectionError(message);
            setConnectionState(EMPTY_CONNECTION_STATE);
            return {
                ...EMPTY_CONNECTION_STATE,
                error: message,
            };
        } finally {
            setIsLoadingConnection(false);
        }
    }, [resetConnectionState, userId]);

    useEffect(() => {
        refreshConnectionStatus();
    }, [refreshConnectionStatus]);

    const approvePendingRequest = useCallback(async (requestId) => {
        if (!requestId) {
            throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
        }

        setConnectionAction('approve');
        setConnectionError(null);
        try {
            await approveDietitianConnectionRequest(requestId);
            return await refreshConnectionStatus();
        } catch (error) {
            const message = normalizeErrorMessage(error);
            setConnectionError(message);
            throw new Error(message);
        } finally {
            setConnectionAction(null);
        }
    }, [refreshConnectionStatus]);

    const rejectPendingRequest = useCallback(async (requestId) => {
        if (!requestId) {
            throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
        }

        setConnectionAction('reject');
        setConnectionError(null);
        try {
            await rejectDietitianConnectionRequest(requestId);
            return await refreshConnectionStatus();
        } catch (error) {
            const message = normalizeErrorMessage(error);
            setConnectionError(message);
            throw new Error(message);
        } finally {
            setConnectionAction(null);
        }
    }, [refreshConnectionStatus]);

    const value = useMemo(() => ({
        ...connectionState,
        isLoadingConnection,
        connectionAction,
        connectionError,
        refreshConnectionStatus,
        approvePendingRequest,
        rejectPendingRequest,
    }), [
        approvePendingRequest,
        connectionAction,
        connectionError,
        connectionState,
        isLoadingConnection,
        refreshConnectionStatus,
        rejectPendingRequest,
    ]);

    return (
        <DietitianConnectionContext.Provider value={value}>
            {children}
        </DietitianConnectionContext.Provider>
    );
};

export const useDietitianConnection = () => useContext(DietitianConnectionContext);
