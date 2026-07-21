import React from 'react';
import { InfoPlaceholderScreen } from '../components/placeholder';

export default function SettingsScreen({ navigation }) {
  return (
    <InfoPlaceholderScreen
      navigation={navigation}
      title="Ayarlar"
      icon="settings"
      emptyTitle="Uygulama ayarları"
      description="Ayar seçenekleri henüz kullanıma açık değil."
    />
  );
}
