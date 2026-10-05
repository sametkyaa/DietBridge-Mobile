import React from 'react';
import { Alert } from 'react-native';
import { AppButton, AppCard, InlineAlert } from '../../../shared/components/ui';
import { useInviteFlow } from '../context/InviteFlowContext';
import { useInviteProfileActions } from '../viewmodels/useInviteProfileActions';

export default function InviteProfileActions() {
    const { openInvite } = useInviteFlow();
    const vm = useInviteProfileActions();
    const confirmLeave = () => Alert.alert('Diyetisyenimden ayrıl', 'Aktif diyetisyen bağlantınız sonlandırılacak. Ayrılmak istiyor musunuz?', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayrıl', style: 'destructive', onPress: () => { void vm.leave(); } },
    ]);
    return (
        <AppCard>
            {vm.message ? <InlineAlert variant={vm.success ? 'success' : 'error'} message={vm.message} /> : null}
            <AppButton label="Diyetisyen kodu gir" variant="secondary" disabled={vm.busy} onPress={() => openInvite()} />
            {vm.hasActiveDietitian ? <AppButton label="Diyetisyenimden ayrıl" variant="text" loading={vm.busy} onPress={confirmLeave} /> : null}
        </AppCard>
    );
}
