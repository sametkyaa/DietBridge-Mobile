import { useCallback, useEffect, useRef, useState } from 'react';
import { previewInviteCode, redeemInviteCode } from '../services/inviteCodeService';
import { INVITE_MESSAGES, normalizeInviteCode } from '../utils/inviteCodeContract.cjs';
import { useDietitianConnection } from '../context/DietitianConnectionContext';

export function useDietitianInviteViewModel({ initialCode, userId, onComplete }) {
    const { refreshConnectionStatus } = useDietitianConnection();
    const [code, setCode] = useState(initialCode || '');
    const [profile, setProfile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [completed, setCompleted] = useState(false);
    const generation = useRef(0);
    const lock = useRef(false);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; generation.current += 1; };
    }, []);
    const changeCode = useCallback((value) => {
        generation.current += 1;
        setCode(value); setProfile(null); setMessage(null); setCompleted(false);
    }, []);
    const preview = useCallback(async (value = code) => {
        if (lock.current) return;
        const normalized = normalizeInviteCode(value);
        if (!normalized) { setMessage(INVITE_MESSAGES.not_found); return; }
        const current = ++generation.current;
        lock.current = true; setBusy(true); setMessage(null); setProfile(null);
        try {
            const result = await previewInviteCode(normalized, userId);
            if (!mounted.current || current !== generation.current) return;
            if (result.result === 'ready') setProfile(result.dietitian);
            else setMessage(INVITE_MESSAGES[result.result] || INVITE_MESSAGES.error);
        } catch {
            if (mounted.current && current === generation.current) setMessage(INVITE_MESSAGES.error);
        } finally {
            lock.current = false;
            if (mounted.current) setBusy(false);
        }
    }, [code, userId]);
    const initialized = useRef(false);
    useEffect(() => {
        if (initialCode && !initialized.current) { initialized.current = true; void preview(initialCode); }
    }, [initialCode, preview]);
    const redeem = async () => {
        if (!profile || lock.current || completed) return;
        const current = generation.current;
        lock.current = true; setBusy(true); setMessage(null);
        try {
            const result = await redeemInviteCode(code, userId);
            if (!mounted.current || current !== generation.current) return;
            if (result === 'connected' || result === 'already_connected') {
                setCompleted(true);
                setMessage(result === 'already_connected' ? INVITE_MESSAGES.already_connected : 'Diyetisyen bağlantınız tamamlandı.');
                // A failed refresh does not repeat an already successful redeem.
                await refreshConnectionStatus();
                if (mounted.current && current === generation.current) await onComplete();
            } else { setProfile(null); setMessage(INVITE_MESSAGES[result] || INVITE_MESSAGES.error); }
        } catch {
            if (mounted.current && current === generation.current) setMessage(INVITE_MESSAGES.error);
        } finally { lock.current = false; if (mounted.current) setBusy(false); }
    };
    return { code, changeCode, profile, busy, message, completed, preview: () => preview(), redeem };
}
