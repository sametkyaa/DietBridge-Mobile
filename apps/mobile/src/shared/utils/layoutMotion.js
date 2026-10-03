import { LayoutAnimation } from 'react-native';

// Animates the next layout change (items moving, appearing or disappearing) with a soft fade.
export function animateNextLayout({ duration = 220, reduced = false } = {}) {
  if (reduced) return;
  LayoutAnimation.configureNext(LayoutAnimation.create(duration, 'easeInEaseOut', 'opacity'));
}

export default animateNextLayout;
