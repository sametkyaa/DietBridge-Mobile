import React from 'react';
import { AppButton, AppCard } from '../../../shared/components/ui';
import { useInviteFlow } from '../context/InviteFlowContext';
import { useDietitianConnection } from '../context/DietitianConnectionContext';

export default function InviteProfileActions() {
    const { openInvite } = useInviteFlow();
    const { hasActiveDietitian, isLoadingConnection } = useDietitianConnection();
    if (isLoadingConnection || hasActiveDietitian) return null;
    return (
        <AppCard>
            <AppButton label="Diyetisyen kodu gir" variant="secondary" onPress={() => openInvite()} />
        </AppCard>
    );
}
