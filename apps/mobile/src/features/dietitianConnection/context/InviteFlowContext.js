import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { clearPendingInviteCode, readPendingInviteCode, storePendingInviteCode } from '../services/inviteCodeService';
import { parseInviteLink, normalizeInviteCode, INVITE_MESSAGES } from '../utils/inviteCodeContract.cjs';
import InviteCodeSheet from '../components/InviteCodeSheet';

const Context = createContext({ openInvite: () => {}, error: null });
export const useInviteFlow = () => useContext(Context);
export function InviteFlowProvider({ children, userId }) {
    const [pending, setPending] = useState(null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState(null);
    const version = useRef(0);
    const openInvite = useCallback((code = '') => {
        version.current += 1;
        setPending(code ? normalizeInviteCode(code) || code : ''); setOpen(true); setError(null);
    }, []);
    const close = useCallback(async () => {
        try { await clearPendingInviteCode(); } catch { setError(INVITE_MESSAGES.error); return; }
        version.current += 1; setPending(null); setOpen(false);
    }, []);
    useEffect(() => {
        let active = true;
        const initialVersion = version.current;
        const handleUrl = async (url) => {
            const code = parseInviteLink(url);
            if (!code || !active) return;
            const current = ++version.current;
            try {
                await storePendingInviteCode(code);
                if (active && current === version.current) { setPending(code); setOpen(true); setError(null); }
            } catch { if (active) setError(INVITE_MESSAGES.error); }
        };
        const restore = async () => {
            try {
                const [url, saved] = await Promise.all([Linking.getInitialURL(), readPendingInviteCode()]);
                if (!active || initialVersion !== version.current) return;
                if (parseInviteLink(url)) await handleUrl(url);
                else if (saved) { setPending(saved); setOpen(true); }
            } catch { if (active) setError(INVITE_MESSAGES.error); }
        };
        const listener = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
        void restore();
        return () => { active = false; listener.remove(); };
    }, []);
    return (
        <Context.Provider value={{ openInvite, error }}>
            {children}
            {userId && open ? <InviteCodeSheet key={`${userId}:${pending}`} code={pending} userId={userId} onClose={close} onComplete={close} /> : null}
        </Context.Provider>
    );
}
