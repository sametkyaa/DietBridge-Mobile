import { colors } from './colors';

// Depth is used sparingly: cards sit flat on the tinted canvas, only the hero
// surface and sheets lift.
export const shadows = {
  card: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  hero: {
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
  },
  sheet: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
};
