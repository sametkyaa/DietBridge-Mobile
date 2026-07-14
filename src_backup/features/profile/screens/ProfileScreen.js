import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useProfileViewModel } from '../viewmodels/useProfileViewModel';
import MenuItem from '../../../shared/components/MenuItem';
import StatCard from '../../../shared/components/StatCard';

const ProfileScreen = ({ navigation }) => {
    const { state, actions } = useProfileViewModel(navigation);
    const { userName, notificationsEnabled, waterRemindersEnabled } = state;
    const { setNotificationsEnabled, setWaterRemindersEnabled, handleLogout } = actions;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profilim</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                decelerationRate="fast"
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={40} color="#9CA3AF" />
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <Ionicons name="pencil" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.userName}>{userName}</Text>

                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>Aktif Danışan</Text>
                    </View>

                    <Text style={styles.dietitianInfo}>Diyetisyen: Dr. İrem Naz</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <StatCard title="Boy" value="184 cm" />
                    <StatCard title="Kilo" value="120 kg" highlight />
                    <StatCard title="Hedef" value="100 kg" />
                </View>

                {/* Medical Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>TIBBI BİLGİLER</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="medkit-outline"
                            title="Kronik Rahatsızlıklar"
                            value="Haşimato Tiroidi"
                            valueStyle={{ color: '#4B5563' }}
                        />
                        <MenuItem
                            icon="flask-outline"
                            title="Kullanılan İlaçlar"
                            value="Levotiron 50mg"
                        />
                        <MenuItem
                            icon="water-outline"
                            title="Kan Grubu"
                            value="A Rh+"
                        />
                        <MenuItem
                            icon="calendar-outline"
                            title="Son Tahlil Tarihi"
                            value="12 Ekim 2025"
                        />
                    </View>
                </View>

                {/* Lifestyle Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>YAŞAM TARZI</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="bed-outline"
                            title="Uyku Düzeni"
                            value="Ortalama 6 saat (Düzensiz)"
                            valueStyle={styles.textWarning}
                        />
                        <MenuItem
                            icon="walk-outline"
                            title="Aktivite Seviyesi"
                            value="Haftada 3 gün yürüyüş"
                        />
                        <MenuItem
                            icon="wine-outline"
                            title="Sigara / Alkol"
                            value="Sosyal içici"
                        />
                    </View>
                </View>

                {/* Nutritional Preferences Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>BESLENME DETAYLARI</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="restaurant-outline"
                            title="Beslenme Tipi"
                            value="Glutensiz"
                            isBadge
                        />
                        <MenuItem
                            icon="alert-circle-outline"
                            title="Besin İntoleransı"
                            value="Laktoz"
                        />
                        <MenuItem
                            icon="ban-outline"
                            title="Sevilmeyen Besinler"
                            value="Brokoli, Bamya"
                        />
                        <MenuItem
                            icon="water-outline"
                            title="Su Hedefi"
                            value="2.5 Litre / Gün"
                        />
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>Ayarlar</Text>
                    <View style={styles.sectionContent}>
                        <MenuItem
                            icon="notifications-outline"
                            title="Öğün Hatırlatıcıları"
                            hasToggle
                            isToggled={notificationsEnabled}
                            onToggle={setNotificationsEnabled}
                        />
                        <MenuItem
                            icon="water-outline"
                            title="Su Bildirimleri"
                            hasToggle
                            isToggled={waterRemindersEnabled}
                            onToggle={setWaterRemindersEnabled}
                        />
                        <MenuItem
                            icon="lock-closed-outline"
                            title="Şifre Değiştir"
                            onPress={() => Alert.alert('Bilgi', 'Şifre değiştirme ekranı yakında eklenecek.')}
                        />
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versiyon 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    statusBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    statusText: {
        color: '#166534',
        fontSize: 13,
        fontWeight: '600',
    },
    dietitianInfo: {
        fontSize: 14,
        color: '#6B7280',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    textWarning: {
        color: '#EF4444',
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FEE2E2',
        marginBottom: 24,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    versionText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 20,
    },
});

export default ProfileScreen;
