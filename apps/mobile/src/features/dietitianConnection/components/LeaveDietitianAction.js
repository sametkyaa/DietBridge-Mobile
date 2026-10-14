import { Alert } from '../../../shared/utils/errorAlert';
import React from 'react';

import { AppButton, AppCard, InlineAlert } from '../../../shared/components/ui';
import { useInviteProfileActions } from '../viewmodels/useInviteProfileActions';

export default function LeaveDietitianAction({ disabled = false }) {
    const vm = useInviteProfileActions();
    if (!vm.hasActiveDietitian && !vm.message) return null;
    const confirmLeave = () => Alert.alert('Diyetisyenimden ayrıl', 'Aktif diyetisyen bağlantınız sonlandırılacak. Ayrılmak istiyor musunuz?', [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayrıl', style: 'destructive', onPress: () => { void vm.leave(); } },
    ]);
    return (
        <AppCard>
            {vm.message ? <InlineAlert variant={vm.success ? 'success' : 'error'} message={vm.message} /> : null}
            {vm.hasActiveDietitian
                ? <AppButton label="Diyetisyenimden ayrıl" variant="text" loading={vm.busy} disabled={disabled} onPress={confirmLeave} />
                : null}
        </AppCard>
    );
}
