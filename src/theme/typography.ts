import { colors } from './colors';

export const fontSizes = {
  caption: 12,
  body: 16,
  section: 18,
  title: 26,
} as const;

export const fontWeights = {
  regular: '400',
  semiBold: '600',
  bold: '700',
} as const;

export const typography = {
  title: {
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    color: colors.text,
  },
  section: {
    fontSize: fontSizes.section,
    fontWeight: fontWeights.semiBold,
    color: colors.text,
  },
  body: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    color: colors.text,
  },
  bodySecondary: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.regular,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.regular,
    color: colors.textMuted,
  },
} as const;
