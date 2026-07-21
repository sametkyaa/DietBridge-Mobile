import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppCard, AppSkeleton, Icon, InlineAlert, StatusBadge } from '../../../../shared/components/ui';
import { colors, radius, spacing, typography } from '../../../../shared/theme';

export function DietitianProfileCard({ loading, dietitian, hasActive, error, expanded, onToggle }) {
    if (loading) return <AppCard><View accessible accessibilityRole="progressbar" accessibilityLabel="Diyetisyen bilgisi yükleniyor" accessibilityState={{ busy: true }}><AppSkeleton height={64} animated /></View></AppCard>;
    if (!hasActive || !dietitian) return error
        ? <InlineAlert variant="error" title="Diyetisyen bilgisi alınamadı" message="Diyetisyen bağlantı bilgisi alınamadı. Lütfen tekrar deneyin." />
        : <InlineAlert variant="info" title="Diyetisyen" message="Henüz aktif bir diyetisyen bağlantınız yok." />;
    const avatar = dietitian.avatarSignedUrl || dietitian.avatarUrl;
    const name = String(dietitian.fullName || dietitian.name || '').trim();
    const details = [
        ['E-posta', dietitian.email], ['Uzmanlık', dietitian.specialization], ['Okul', dietitian.university],
        ['Deneyim', dietitian.experienceYears == null ? null : `${dietitian.experienceYears} yıl`], ['Hakkında', dietitian.bio],
    ].filter(([, value]) => value);
    return (
        <AppCard style={styles.card}>
            <Pressable onPress={onToggle} accessibilityRole="button" accessibilityLabel={`Diyetisyen ${name}, ayrıntıları ${expanded ? 'kapat' : 'aç'}`} accessibilityState={{ expanded }} style={({ pressed }) => [styles.header, pressed && styles.pressed]}>
                {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} accessibilityLabel={`${name} profil fotoğrafı`} /> : <View style={[styles.avatar, styles.fallback]}><Icon name="person" color={colors.primaryDark} /></View>}
                <View style={styles.textWrap}><Text style={styles.label}>Diyetisyeniniz</Text><Text style={styles.name}>{name}</Text></View>
                <StatusBadge status="connected" />
                <Icon name={expanded ? 'chevronUp' : 'chevronDown'} color={colors.textTertiary} />
            </Pressable>
            {error ? <InlineAlert variant="error" message="Diyetisyen bağlantı bilgisi yenilenemedi. Lütfen tekrar deneyin." style={styles.error} /> : null}
            {expanded ? <View style={styles.details}>{details.length ? details.map(([label, value]) => <View key={label} style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>) : <Text style={styles.detailValue}>Ek profil bilgisi bulunmuyor.</Text>}</View> : null}
        </AppCard>
    );
}

const styles = StyleSheet.create({
    card: { padding: 0, overflow: 'hidden' },
    header: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.x3, padding: spacing.x4 },
    avatar: { width: 48, height: 48, borderRadius: radius.round },
    fallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    textWrap: { flex: 1, minWidth: 0 },
    label: { ...typography.caption, color: colors.textSecondary },
    name: { ...typography.bodyMedium, color: colors.textPrimary, marginTop: 2 },
    details: { gap: spacing.x2, borderTopWidth: 1, borderTopColor: colors.borderSoft, backgroundColor: colors.surfaceMuted, padding: spacing.x4 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.x3 },
    detailLabel: { ...typography.caption, color: colors.textSecondary, width: 72 },
    detailValue: { ...typography.supporting, color: colors.textPrimary, flex: 1 },
    pressed: { opacity: 0.8 },
    error: { marginHorizontal: spacing.x4, marginBottom: spacing.x4 },
});

export default DietitianProfileCard;
