export const colors = {
  background: '#F1F4F3',
  surface: '#FBFCFC',

  text: '#16212C',
  textSecondary: '#41505E',
  textMuted: '#7A8894',

  border: '#D3DBD8',
  borderSoft: '#E3E8E6',

  primary: '#2E7BD6',
  success: '#2F9160',
  warning: '#E08A34',
  error: '#C4453D',

  primarySoft: '#E7F0FB',
  successSoft: '#E4F3EB',
  warningSoft: '#FBEFDF',
  errorSoft: '#FAE8E7',

  white: '#FFFFFF',
} as const;

export const spacing = {
  sm: 8,
  md: 12,
  lg: 16,
  xxl: 24,
} as const;

export const radii = {
  sm: 10,
  md: 12,
  lg: 14,
} as const;

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
