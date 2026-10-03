import { fontFamilies } from './fonts';

const tabular = { fontVariant: ['tabular-nums'] };

export const typography = {
  display: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6, fontFamily: fontFamilies.semiBold },
  screenTitle: { fontSize: 28, lineHeight: 34, letterSpacing: -0.4, fontFamily: fontFamilies.semiBold },
  sectionTitle: { fontSize: 18, lineHeight: 24, letterSpacing: -0.2, fontFamily: fontFamilies.semiBold },
  cardTitle: { fontSize: 17, lineHeight: 23, letterSpacing: -0.1, fontFamily: fontFamilies.semiBold },
  body: { fontSize: 15, lineHeight: 22, fontFamily: fontFamilies.regular },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontFamily: fontFamilies.medium },
  supporting: { fontSize: 13, lineHeight: 19, fontFamily: fontFamilies.regular },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fontFamilies.medium },
  button: { fontSize: 15, lineHeight: 20, fontFamily: fontFamilies.semiBold },
  buttonLarge: { fontSize: 16, lineHeight: 20, fontFamily: fontFamilies.semiBold },
  numeric: { fontSize: 28, lineHeight: 32, letterSpacing: -0.5, fontFamily: fontFamilies.semiBold, ...tabular },
  numericSmall: { fontSize: 17, lineHeight: 22, fontFamily: fontFamilies.semiBold, ...tabular },
};
