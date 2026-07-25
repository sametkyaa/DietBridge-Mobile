import { supabase } from '../../../lib/supabaseClient';

export const CONNECTION_REQUIRED_MESSAGE = 'Bu özelliği kullanmak için aktif bir diyetisyen bağlantınız olmalı.';
export const CONNECTION_GENERIC_ERROR_MESSAGE = 'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.';
export const CONNECTION_STALE_REQUEST_MESSAGE = 'Bu bağlantı isteği artık geçerli değil.';
export const CONNECTION_ACTIVE_EXISTS_MESSAGE = 'Zaten aktif bir diyetisyen bağlantınız var.';

// Realtime ownership stays in the service layer; consumers only receive an
// invalidation signal and re-read the normalized connection status.
export const subscribeDietitianConnectionChanges = ({ clientId, onChange } = {}) => {
    if (!clientId || typeof onChange !== 'function') return () => {};

    const channel = supabase
        .channel(`dietitian-connection:${clientId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'dietitian_clients',
            filter: `client_id=eq.${clientId}`,
        }, onChange)
        .subscribe();

    return () => {
        try {
            supabase.removeChannel(channel);
        } catch (error) {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
                console.warn('Dietitian connection realtime cleanup failed.');
            }
        }
    };
};

const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }
    return user;
};

const normalizeFullName = (value) => String(value || '').trim();

const getDietitianProfilesById = async (dietitianIds = []) => {
    const uniqueIds = [...new Set(dietitianIds.filter(Boolean))];
    if (uniqueIds.length === 0) return {};

    const [{ data: profiles, error: profilesError }, { data: dietitianProfiles, error: dietitianProfilesError }] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', uniqueIds),
        supabase
            .from('dietitian_profiles')
            .select('user_id, specialization, university, experience_years, bio')
            .in('user_id', uniqueIds),
    ]);

    if (profilesError || dietitianProfilesError) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.error('Assigned dietitian could not be loaded', {
                dietitianIds: uniqueIds,
                profilesError,
                dietitianProfilesError,
            });
        }
    }

    const profileMap = {};
    (profiles || []).forEach((profile) => {
        const fullName = normalizeFullName(profile.full_name);
        profileMap[profile.id] = {
            id: profile.id,
            fullName,
            name: fullName,
            email: profile.email || '',
            nameLoadError: false,
        };
    });

    (dietitianProfilesError ? [] : dietitianProfiles || []).forEach((detail) => {
        const existing = profileMap[detail.user_id] || {
            id: detail.user_id,
            fullName: '',
            name: '',
            email: '',
            nameLoadError: false,
        };
        profileMap[detail.user_id] = {
            ...existing,
            specialization: detail.specialization || '',
            university: detail.university || '',
            experienceYears: detail.experience_years ?? null,
            bio: detail.bio || '',
        };
    });

    uniqueIds.forEach((id) => {
        if (!profileMap[id]) {
            profileMap[id] = {
                id,
                fullName: '',
                name: '',
                email: '',
                nameLoadError: false,
            };
        }
    });

    // For dietitians whose profiles.full_name is empty, try the secure RPC fallback.
    // The RPC reads auth.users.raw_user_meta_data via SECURITY DEFINER.
    const idsNeedingFallback = uniqueIds.filter((id) => {
        const entry = profileMap[id];
        return entry && !entry.fullName && !entry.nameLoadError;
    });

    if (idsNeedingFallback.length > 0 && !profilesError) {
        const fallbackResults = await Promise.all(
            idsNeedingFallback.map(async (id) => {
                const { data, error } = await supabase.rpc('get_dietitian_display_name', {
                    p_dietitian_id: id,
                });
                return { id, name: data, error };
            }),
        );

        fallbackResults.forEach(({ id, name, error }) => {
            if (error) {
                if (typeof __DEV__ !== 'undefined' && __DEV__) {
                    console.warn('Dietitian display name RPC failed for', id, error.message);
                }
                if (profileMap[id]) profileMap[id].nameLoadError = true;
                return;
            }
            const resolvedName = normalizeFullName(name);
            if (profileMap[id]) {
                profileMap[id].fullName = resolvedName;
                profileMap[id].name = resolvedName;
                if (!resolvedName) profileMap[id].nameLoadError = true;
            }
        });
    } else if (profilesError) {
        // If the profiles query itself failed, mark all as load-error.
        uniqueIds.forEach((id) => {
            if (profileMap[id]) profileMap[id].nameLoadError = true;
        });
    }

    return profileMap;
};

const mapConnection = (connection, profileMap = {}) => {
    if (!connection) return null;

    const dietitian = profileMap[connection.dietitian_id] || {
        id: connection.dietitian_id,
        fullName: '',
        name: '',
        email: '',
        nameLoadError: false,
    };

    return {
        id: connection.id,
        status: connection.status,
        dietitianId: connection.dietitian_id,
        clientId: connection.client_id,
        createdAt: connection.created_at,
        acceptedAt: connection.accepted_at,
        rejectedAt: connection.rejected_at,
        dietitian,
    };
};

const buildConnectionStatus = (connections = [], profileMap = {}) => {
    const activeConnection = connections.find((connection) => connection.status === 'active') || null;
    const pendingConnection = connections.find((connection) => connection.status === 'pending') || null;
    const activeDietitian = activeConnection ? mapConnection(activeConnection, profileMap).dietitian : null;
    const pendingRequest = !activeConnection && pendingConnection
        ? mapConnection(pendingConnection, profileMap)
        : null;

    return {
        connectionStatus: activeConnection ? 'active' : pendingRequest ? 'pending' : 'none',
        activeConnection: activeConnection ? mapConnection(activeConnection, profileMap) : null,
        activeDietitian,
        pendingRequest,
        hasActiveDietitian: !!activeConnection,
    };
};

export const getDietitianConnectionStatus = async () => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
        .from('dietitian_clients')
        .select('id, dietitian_id, client_id, status, created_at, accepted_at, rejected_at')
        .eq('client_id', user.id)
        .in('status', ['active', 'pending'])
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('Dietitian connection lookup error:', error.message);
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }

    const connections = data || [];
    const profileMap = await getDietitianProfilesById(connections.map((connection) => connection.dietitian_id));

    return buildConnectionStatus(connections, profileMap);
};

export const getActiveDietitianConnection = async (clientId) => {
    const user = clientId ? { id: clientId } : await getCurrentUser();

    const { data, error } = await supabase
        .from('dietitian_clients')
        .select('id, dietitian_id, client_id, status')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

    if (error) {
        console.warn('Active dietitian connection lookup error:', error.message);
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }

    return data || null;
};

export const approveDietitianConnectionRequest = async (requestId) => {
    const user = await getCurrentUser();

    const { data: pendingRequest, error: pendingError } = await supabase
        .from('dietitian_clients')
        .select('id, dietitian_id')
        .eq('id', requestId)
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

    if (pendingError) {
        console.warn('Pending dietitian request lookup error:', pendingError.message);
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }

    if (!pendingRequest) {
        throw new Error(CONNECTION_STALE_REQUEST_MESSAGE);
    }

    const activeConnection = await getActiveDietitianConnection(user.id);
    if (activeConnection) {
        throw new Error(CONNECTION_ACTIVE_EXISTS_MESSAGE);
    }

    const { data, error } = await supabase
        .from('dietitian_clients')
        .update({
            status: 'active',
            accepted_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .select('id, dietitian_id, client_id, status, created_at, accepted_at, rejected_at')
        .maybeSingle();

    if (error) {
        console.warn('Approve dietitian request error:', error.message);
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }

    if (!data) {
        throw new Error(CONNECTION_STALE_REQUEST_MESSAGE);
    }

    return data;
};

export const rejectDietitianConnectionRequest = async (requestId) => {
    const user = await getCurrentUser();

    const { data, error } = await supabase
        .from('dietitian_clients')
        .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('client_id', user.id)
        .eq('status', 'pending')
        .select('id, dietitian_id, client_id, status, created_at, rejected_at')
        .maybeSingle();

    if (error) {
        console.warn('Reject dietitian request error:', error.message);
        throw new Error(CONNECTION_GENERIC_ERROR_MESSAGE);
    }

    if (!data) {
        throw new Error(CONNECTION_STALE_REQUEST_MESSAGE);
    }

    return data;
};
