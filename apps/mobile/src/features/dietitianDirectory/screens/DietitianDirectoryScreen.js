import { Alert } from '../../../shared/utils/errorAlert';
import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppInput, EmptyState, ErrorState, Icon, InlineAlert, ScreenHeader, SkeletonCard } from '../../../shared/components/ui';
import { colors, spacing, typography } from '../../../shared/theme';
import { DietitianConnectionRequestCard } from '../../dietitianConnection/components/DietitianConnectionRequestCard';
import { useDietitianConnection } from '../../dietitianConnection/context/DietitianConnectionContext';
import { useDietitianDirectory } from '../context/DietitianDirectoryContext';
import { useDietitianDirectoryViewModel } from '../viewmodels/useDietitianDirectoryViewModel';
import { OPEN_INQUIRY_LIMIT } from '../utils/directoryContract.cjs';
import { ConnectionRequestStatusCard } from '../components/ConnectionRequestStatusCard';
import { DietitianListItem } from '../components/DietitianListItem';

const Separator = () => <View style={styles.separator} />;

export default function DietitianDirectoryScreen({ navigation }) {
    const vm = useDietitianDirectoryViewModel();
    const directory = useDietitianDirectory();
    const connection = useDietitianConnection();
    const pendingDietitianName = vm.pendingRequest
        ? (vm.dietitians.find((item) => item.id === vm.pendingRequest.dietitianId)?.name
            || directory.inquiries.find((item) => item.dietitianId === vm.pendingRequest.dietitianId)?.dietitianName
            || null)
        : null;

    const openProfile = (dietitian) => navigation.navigate('DietitianPublicProfile', { dietitianId: dietitian.id, dietitian });

    const header = (
        <View style={styles.listHeader}>
            {connection.pendingRequest ? (
                <DietitianConnectionRequestCard
                    request={connection.pendingRequest}
                    action={connection.connectionAction}
                    error={connection.connectionError}
                    onApprove={() => connection.approvePendingRequest(connection.pendingRequest.id).catch(() => {})}
                    onReject={() => Alert.alert(
                        'Bağlantı isteğini reddet',
                        'Bu diyetisyenin bağlantı isteğini reddetmek istediğinize emin misiniz?',
                        [
                            { text: 'Vazgeç', style: 'cancel' },
                            { text: 'İsteği Reddet', style: 'destructive', onPress: () => connection.rejectPendingRequest(connection.pendingRequest.id).catch(() => {}) },
                        ],
                    )}
                />
            ) : null}
            {vm.pendingRequest ? (
                <ConnectionRequestStatusCard
                    dietitianName={pendingDietitianName}
                    isCancelling={directory.isCancellingRequest}
                    onCancel={() => directory.cancelPendingRequest().catch(() => {})}
                    onOpenProfile={() => navigation.navigate('DietitianPublicProfile', { dietitianId: vm.pendingRequest.dietitianId })}
                />
            ) : null}
            <AppInput
                value={vm.search}
                onChangeText={vm.setSearch}
                placeholder="Ad veya uzmanlık alanı ara"
                accessibilityLabel="Diyetisyen ara"
                autoCorrect={false}
                returnKeyType="search"
                maxLength={80}
                rightAccessory={<Icon name="search" size={20} color={colors.textSecondary} />}
            />
            <Text style={styles.limitHint}>
                {`Aynı anda en fazla ${OPEN_INQUIRY_LIMIT} diyetisyenle ön görüşme yapabilir, yalnızca birine bağlanma isteği gönderebilirsin. Açık ön görüşme: ${vm.openInquiryCount}/${OPEN_INQUIRY_LIMIT}`}
            </Text>
            {vm.status === 'ready' && vm.error ? <InlineAlert variant="error" message={vm.error} /> : null}
        </View>
    );

    let body;
    if (vm.status === 'loading') {
        body = (
            <View accessibilityRole="progressbar" accessibilityLabel="Diyetisyenler yükleniyor" accessibilityState={{ busy: true }} style={styles.loading}>
                {header}
                {[1, 2, 3].map((key) => <SkeletonCard key={key} animated style={styles.skeleton} />)}
            </View>
        );
    } else if (vm.status === 'error') {
        body = (
            <View style={styles.loading}>
                {header}
                <ErrorState title="Diyetisyenler yüklenemedi" description={vm.error} onRetry={vm.retry} />
            </View>
        );
    } else {
        body = (
            <FlatList
                data={vm.dietitians}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <DietitianListItem dietitian={item} onPress={() => openProfile(item)} />}
                ItemSeparatorComponent={Separator}
                ListHeaderComponent={header}
                ListEmptyComponent={(
                    <EmptyState
                        icon="person"
                        title={vm.isSearching ? 'Sonuç bulunamadı' : 'Şu anda listelenen diyetisyen yok'}
                        description={vm.isSearching ? 'Farklı bir ad veya uzmanlık alanı deneyebilirsin.' : 'Diyetisyenler profillerini listeye açtıkça burada görünecek.'}
                    />
                )}
                ListFooterComponent={vm.isLoadingMore ? <ActivityIndicator style={styles.footer} color={colors.primaryDark} /> : null}
                onEndReached={vm.loadMore}
                onEndReachedThreshold={0.4}
                refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.refresh} tintColor={colors.primaryDark} />}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            />
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <ScreenHeader title="Diyetisyenler" subtitle="Profilleri incele, ön görüşme yap ve sana uygun diyetisyene bağlan." />
            <View style={styles.content}>{body}</View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1, paddingHorizontal: spacing.x5 },
    listHeader: { gap: spacing.x3, marginBottom: spacing.x4 },
    limitHint: { ...typography.caption, color: colors.textSecondary },
    listContent: { paddingBottom: spacing.x8, flexGrow: 1 },
    separator: { height: spacing.x3 },
    loading: { flex: 1 },
    skeleton: { marginBottom: spacing.x3 },
    footer: { marginVertical: spacing.x4 },
});
