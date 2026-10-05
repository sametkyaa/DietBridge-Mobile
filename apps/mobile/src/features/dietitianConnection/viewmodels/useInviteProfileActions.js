import { useRef, useState, useEffect } from 'react';
import { useDietitianConnection } from '../context/DietitianConnectionContext';
import { leaveDietitian } from '../services/inviteCodeService';
import { INVITE_MESSAGES } from '../utils/inviteCodeContract.cjs';

export function useInviteProfileActions() {
    const { userId, hasActiveDietitian, refreshConnectionStatus } = useDietitianConnection();
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);
    const [success, setSuccess] = useState(false);
    const activeActor = useRef(userId);
    const lock = useRef(false);
    useEffect(() => { activeActor.current = userId; setMessage(null); setBusy(false); setSuccess(false); return () => { activeActor.current = null; }; }, [userId]);
    const leave = async () => {
        if (lock.current) return;
        const actor = userId; lock.current = true; setBusy(true); setMessage(null); setSuccess(false);
        try {
            const result = await leaveDietitian(actor);
            if (activeActor.current !== actor) return;
            setSuccess(true); setMessage(result === 'left' ? 'Diyetisyen bağlantınız sonlandırıldı.' : 'Aktif diyetisyen bağlantınız yok.');
            await refreshConnectionStatus();
        } catch { if (activeActor.current === actor) setMessage(INVITE_MESSAGES.error); }
        finally { lock.current = false; if (activeActor.current === actor) setBusy(false); }
    };
    return { busy, message, success, hasActiveDietitian, leave };
}
