import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ICON_MAP = {
  back: 'arrow-left',
  forward: 'arrow-right',
  up: 'arrow-up',
  down: 'arrow-down',
  check: 'check',
  checkDouble: 'check-all',
  close: 'close',
  plus: 'plus',
  minus: 'minus',
  clock: 'clock-outline',
  hourglass: 'timer-sand',
  alert: 'alert-circle-outline',
  info: 'information-outline',
  home: 'home-outline',
  analytics: 'chart-line',
  search: 'magnify',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  chevronRight: 'chevron-right',
  send: 'send',
  calendar: 'calendar-outline',
  message: 'message-text-outline',
  person: 'account-outline',
  dot: 'circle-small',
  edit: 'pencil-outline',
  camera: 'camera-outline',
  image: 'image-outline',
  settings: 'cog-outline',
  support: 'help-circle-outline',
  bell: 'bell-outline',
  undo: 'undo',
  wifiOff: 'wifi-off',
  droplet: 'water-outline',
  footprints: 'shoe-print',
  drumstick: 'food-drumstick-outline',
  wheat: 'barley',
  target: 'target',
  leaf: 'leaf',
  meal: 'silverware-fork-knife',
  sprout: 'sprout',
  heartPulse: 'heart-pulse',
  shield: 'shield-outline',
  logout: 'logout',
  key: 'key-outline',
  devices: 'devices',
  download: 'download-outline',
  trash: 'delete-outline',
};

export function Icon({
  name,
  size = 20,
  color = colors.textPrimary,
  style,
  accessible = false,
  accessibilityLabel,
}) {
  return (
    <MaterialCommunityIcons
      name={ICON_MAP[name] || 'help-circle-outline'}
      size={size}
      color={color}
      style={style}
      accessible={accessible}
      accessibilityLabel={accessible ? accessibilityLabel : undefined}
      importantForAccessibility={accessible ? 'yes' : 'no'}
    />
  );
}

export default Icon;
