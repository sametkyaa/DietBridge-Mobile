import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getUserProfile, signOut } from '../services/profileService';

export const useProfileViewModel = (navigation) => {
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('Kullanıcı');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [waterRemindersEnabled, setWaterRemindersEnabled] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        const { user, error } = await getUserProfile();
        if (user?.user_metadata?.full_name) {
            setUserName(user.user_metadata.full_name);
        }
        if (error) {
            console.log('Error fetching user:', error);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        Alert.alert(
            'Çıkış Yap',
            'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: performLogout,
                },
            ]
        );
    };

    const performLogout = async () => {
        setLoading(true);
        const { error } = await signOut();
        if (error) {
            Alert.alert('Hata', error.message);
        }
        setLoading(false);
        // Navigation logic for logout usually handled by Auth state listener in App.js/Navigation
        // But if needed, we can navigate here.
    };

    return {
        state: {
            loading,
            userName,
            notificationsEnabled,
            waterRemindersEnabled,
        },
        actions: {
            setNotificationsEnabled,
            setWaterRemindersEnabled,
            handleLogout,
            loadProfile,
        },
    };
};
