import React from 'react';
import { InfoPlaceholderScreen } from '../components/placeholder';

export default function SupportScreen({ navigation }) {
  return (
    <InfoPlaceholderScreen
      navigation={navigation}
      title="Destek"
      icon="support"
      emptyTitle="Yardım ve destek"
      description="Destek içerikleri henüz kullanıma açık değil."
    />
  );
}
