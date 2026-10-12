import { useCallback, useEffect, useRef, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { abortChatMedia, cleanupChatMediaFile, getChatMediaEnabled, pickChatMedia, sendChatMedia } from '../services/chatMediaService';

export const useChatMediaUpload = ({ conversationId, onFinalized }) => {
    const [enabled, setEnabled] = useState(false);
    const [selection, setSelection] = useState(null);
    const [stage, setStage] = useState('');
    const [error, setError] = useState(null);
    const [isBusy, setIsBusy] = useState(false);
    const operation = useRef({});
    const source = useRef(null);
    const generation = useRef(0);
    const busy = useRef(false);
    const release = useCallback(() => {
        generation.current += 1; busy.current = false;
        setIsBusy(false);
        void abortChatMedia(operation.current).catch(() => { /* Expiry cleanup is the server fallback. */ });
        cleanupChatMediaFile(source.current); source.current = null; operation.current = {};
    }, []);
    const reset = useCallback(() => { release(); setSelection(null); setError(null); setStage(''); }, [release]);
    useEffect(() => { let active = true; void getChatMediaEnabled().then((value) => { if (active) setEnabled(value); }).catch(() => { if (active) setEnabled(false); }); return () => { active = false; }; }, [conversationId]);
    useEffect(() => { reset(); return release; }, [conversationId, release, reset]);
    const select = async () => {
        if (!enabled || busy.current) return;
        reset(); busy.current = true;
        setIsBusy(true);
        const token = generation.current;
        try {
            const picked = await pickChatMedia();
            if (token !== generation.current) { cleanupChatMediaFile(picked); return; }
            source.current = picked; setSelection(picked);
        } catch { if (token === generation.current) setError('Dosya seçilemedi. Video en fazla 20 MB, belge en fazla 10 MB olabilir.'); }
        finally { if (token === generation.current) { busy.current = false; setIsBusy(false); } }
    };
    const send = async (caption) => {
        if (!selection || !conversationId || busy.current) return false;
        busy.current = true; setError(null);
        setIsBusy(true);
        const token = generation.current;
        const context = operation.current;
        const current = () => token === generation.current;
        try {
            context.clientMessageId ||= Crypto.randomUUID();
            const result = await sendChatMedia({ conversationId, clientMessageId: context.clientMessageId, source: selection, caption,
                operation: context, isCurrent: current, onStage: (value) => { if (current()) setStage(value); } });
            if (!result || !current()) return false;
            await onFinalized(result);
            if (!current()) return false;
            reset();
            return true;
        } catch (failure) { if (current()) { setError(failure.message || 'Dosya gönderilemedi.'); setStage(''); } return false; }
        finally { if (current()) { busy.current = false; setIsBusy(false); } }
    };
    return { enabled, selection, stage, error, select, send, reset, isBusy };
};
