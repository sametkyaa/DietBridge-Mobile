import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { getChatMediaUrl } from '../services/chatMediaService';
import { subscribeToChatImageCacheInvalidation } from '../services/chatImageResolver';
import { colors, typography } from '../../../shared/theme';

export default function ChatMediaBubble({ message }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const generation = useRef(0);
    useEffect(() => { generation.current += 1; return () => { generation.current += 1; }; }, [message.id]);
    useEffect(() => subscribeToChatImageCacheInvalidation(() => { generation.current += 1; setBusy(false); }), []);
    const open = async () => {
        if (busy) return;
        const token = generation.current;
        setBusy(true); setError(null);
        try {
            const url = await getChatMediaUrl(message);
            if (token === generation.current) await Linking.openURL(url);
        } catch (failure) { if (token === generation.current) setError(failure.message || 'Dosya açılamadı.'); }
        finally { if (token === generation.current) setBusy(false); }
    };
    return <View style={styles.container}>
        <Text style={[styles.name, message.isOwn ? styles.own : styles.other]}>{message.attachment?.fileName || (message.messageKind === 'video' ? 'Video' : 'Dosya')}</Text>
        <Text style={[styles.meta, message.isOwn ? styles.own : styles.other]}>{((message.attachment?.byteSize || 0) / 1048576).toFixed(1)} MB</Text>
        <Pressable onPress={open} disabled={busy} accessibilityRole="button" style={styles.action}>
            <Text style={[styles.name, message.isOwn ? styles.own : styles.other]}>{busy ? 'Hazırlanıyor…' : message.messageKind === 'video' ? 'Videoyu aç' : 'Dosyayı aç'}</Text>
        </Pressable>
        {message.body ? <Text style={[styles.caption, message.isOwn ? styles.own : styles.other]}>{message.body}</Text> : null}
        {error ? <Text style={[styles.meta, message.isOwn ? styles.own : styles.other]} accessibilityRole="alert">{error}</Text> : null}
    </View>;
}
const styles = StyleSheet.create({ container: { minWidth: 180, gap: 6 }, name: { ...typography.body, fontWeight: '600' },
    meta: { ...typography.caption }, caption: { ...typography.body }, own: { color: colors.white }, other: { color: colors.textPrimary },
    action: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.textTertiary, paddingHorizontal: 12, borderRadius: 12 } });
