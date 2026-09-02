import { supabase } from '../../../lib/supabaseClient';
import {
    clearAccountDeletionState,
    getAccountDeletionState as readAccountDeletionState,
    saveAccountDeletionState,
} from './accountDeletionStateStore';

export const ACCOUNT_DELETION_OUTCOMES = Object.freeze({
    DELETED: 'DELETED',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    RETRYABLE: 'RETRYABLE',
    AMBIGUOUS_FAILURE: 'AMBIGUOUS_FAILURE',
});

export const ACCOUNT_DELETION_MESSAGES = Object.freeze({
    SESSION_INVALID: 'Hesap silme işlemi için geçerli bir oturum bulunamadı.',
    IDENTITY_MISMATCH: 'Hesap doğrulanamadı. Lütfen tekrar giriş yapın.',
    STATE_UNAVAILABLE: 'Hesap silme durumu doğrulanamadı. Lütfen tekrar deneyin.',
    UNAUTHORIZED: 'Hesap silme isteği doğrulanamadı. Lütfen tekrar giriş yapın.',
    FORBIDDEN: 'Bu hesap silme işlemi şu anda gerçekleştirilemiyor.',
    RETRYABLE: 'Hesap silme işlemi henüz tamamlanamadı. Lütfen tekrar deneyin.',
    AMBIGUOUS_FAILURE: 'Hesap silme işlemi doğrulanamadı. Lütfen tekrar deneyin.',
});

const getCurrentSession = async () => {
    try {
        const {
            data: { session } = {},
            error,
        } = await supabase.auth.getSession();

        if (error || !session?.user?.id) {
            return { ok: false, message: ACCOUNT_DELETION_MESSAGES.SESSION_INVALID };
        }

        return { ok: true, session };
    } catch (_error) {
        return { ok: false, message: ACCOUNT_DELETION_MESSAGES.SESSION_INVALID };
    }
};

const getErrorStatus = (error) => {
    const contextStatus = error?.context?.status;
    if (Number.isInteger(contextStatus)) return contextStatus;
    return Number.isInteger(error?.status) ? error.status : null;
};

const getErrorCode = async (error) => {
    const context = error?.context;
    if (!context || typeof context.clone !== 'function') return null;

    try {
        const payload = await context.clone().json();
        return typeof payload?.error?.code === 'string' ? payload.error.code : null;
    } catch (_error) {
        return null;
    }
};

const createFailure = (outcome, message, extra = {}) => ({
    ok: false,
    outcome,
    message,
    ...extra,
});

const clearMarkerAfterNonDestructiveResponse = async () => {
    try {
        const result = await clearAccountDeletionState();
        return Boolean(result?.ok);
    } catch (_error) {
        return false;
    }
};

export const getAccountDeletionState = readAccountDeletionState;

export const requestAccountDeletion = async ({ expectedUserId } = {}) => {
    const currentSession = await getCurrentSession();
    if (!currentSession.ok) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
            currentSession.message,
            { remoteInvoked: false },
        );
    }

    const userId = currentSession.session.user.id;
    if (expectedUserId !== undefined && expectedUserId !== userId) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
            ACCOUNT_DELETION_MESSAGES.IDENTITY_MISMATCH,
            { code: 'ACCOUNT_DELETION_SESSION_MISMATCH', remoteInvoked: false },
        );
    }

    let storedState;
    try {
        storedState = await readAccountDeletionState();
    } catch (_error) {
        storedState = { ok: false, code: 'ACCOUNT_DELETION_STATE_READ_FAILED' };
    }

    if (!storedState?.ok) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
            ACCOUNT_DELETION_MESSAGES.STATE_UNAVAILABLE,
            { code: storedState?.code || 'ACCOUNT_DELETION_STATE_INVALID', remoteInvoked: false },
        );
    }

    const hadPendingMarker = Boolean(storedState.state);
    if (storedState.state && storedState.state.userId !== userId) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
            ACCOUNT_DELETION_MESSAGES.IDENTITY_MISMATCH,
            { code: 'ACCOUNT_DELETION_MARKER_MISMATCH', markerPreserved: true, remoteInvoked: false },
        );
    }

    const markerResult = await saveAccountDeletionState(userId);
    if (!markerResult?.ok) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
            ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE,
            {
                code: markerResult?.code || 'ACCOUNT_DELETION_STATE_SAVE_FAILED',
                markerPreserved: hadPendingMarker,
                remoteInvoked: false,
            },
        );
    }

    let response;
    try {
        response = await supabase.functions.invoke('delete-client-account', { body: {} });
    } catch (_error) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
            ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE,
            { code: 'ACCOUNT_DELETION_TRANSPORT_FAILED', markerPreserved: true, remoteInvoked: true },
        );
    }

    const { data, error } = response || {};
    if (!error && data?.data?.deleted === true) {
        return {
            ok: true,
            outcome: ACCOUNT_DELETION_OUTCOMES.DELETED,
            userId,
            markerPreserved: true,
            remoteInvoked: true,
        };
    }

    const status = getErrorStatus(error);
    const code = (await getErrorCode(error)) || (status === 503 ? 'deletion_retryable' : null);

    if (status === 401) {
        const markerCleared = hadPendingMarker
            ? false
            : await clearMarkerAfterNonDestructiveResponse();
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.UNAUTHORIZED,
            ACCOUNT_DELETION_MESSAGES.UNAUTHORIZED,
            { code: code || 'unauthorized', markerCleared, markerPreserved: !markerCleared, remoteInvoked: true },
        );
    }

    if (status === 403) {
        const markerCleared = hadPendingMarker
            ? false
            : await clearMarkerAfterNonDestructiveResponse();
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.FORBIDDEN,
            ACCOUNT_DELETION_MESSAGES.FORBIDDEN,
            { code: code || 'forbidden', markerCleared, markerPreserved: !markerCleared, remoteInvoked: true },
        );
    }

    if (status === 503 || code === 'deletion_retryable' || (status !== null && status >= 500)) {
        return createFailure(
            ACCOUNT_DELETION_OUTCOMES.RETRYABLE,
            ACCOUNT_DELETION_MESSAGES.RETRYABLE,
            { code: code || 'deletion_retryable', markerPreserved: true, remoteInvoked: true },
        );
    }

    return createFailure(
        ACCOUNT_DELETION_OUTCOMES.AMBIGUOUS_FAILURE,
        ACCOUNT_DELETION_MESSAGES.AMBIGUOUS_FAILURE,
        { code: code || 'ACCOUNT_DELETION_RESPONSE_INVALID', markerPreserved: true, remoteInvoked: true },
    );
};
