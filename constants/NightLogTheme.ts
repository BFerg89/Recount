export const nightLogColors = {
  paperDeep: '#EBE4D2',
  paper: '#F2EDE0',
  paperCard: '#FBF6E9',
  paperEdge: '#E6DDC4',
  rule: '#D8CFB6',

  ink: '#1C1A14',
  inkMid: '#56503F',
  inkSoft: '#8A8270',

  terracottaSoft: '#E9CBB9',
  terracotta: '#A53D1F',
  terracottaDeep: '#6E2814',

  warm: '#C28A3E',
  rowdy: '#A53D1F',
  late: '#5A7A8F',
  easy: '#6E8C5A',
  euphoric: '#8B5BA8',
  blurry: '#A88E5A',

  personTones: [
    '#B98760',
    '#7E9E81',
    '#9D8FB0',
    '#C28A3E',
    '#5A7A8F',
    '#A53D1F',
    '#6E8C5A',
    '#8B5BA8',
  ],
} as const;

export const nightLogSpacing = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 22,
  s6: 28,
  s7: 36,
  s8: 48,
} as const;

export const nightLogRadius = {
  xs: 4,
  s: 8,
  m: 10,
  l: 14,
  xl: 18,
  pill: 999,
} as const;

export const nightLogFonts = {
  display: 'Newsreader_500Medium',
  italicAccent: 'Newsreader_500Medium_Italic',
  body: 'Geist_400Regular',
  bodyStrong: 'Geist_600SemiBold',
  label: 'Geist_500Medium',
} as const;

export const nightLogType = {
  displayXl: {
    fontFamily: nightLogFonts.display,
    fontSize: 56,
    lineHeight: 53,
    letterSpacing: -1.4,
  },
  displayL: {
    fontFamily: nightLogFonts.display,
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -1,
  },
  displayM: {
    fontFamily: nightLogFonts.display,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -0.6,
  },
  displayS: {
    fontFamily: nightLogFonts.display,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  numeral: {
    fontFamily: nightLogFonts.display,
    fontSize: 48,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
  },
  italicAccent: {
    fontFamily: nightLogFonts.italicAccent,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  bodyL: {
    fontFamily: nightLogFonts.body,
    fontSize: 16,
    lineHeight: 23,
  },
  body: {
    fontFamily: nightLogFonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyS: {
    fontFamily: nightLogFonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: nightLogColors.inkMid,
  },
  caption: {
    fontFamily: nightLogFonts.body,
    fontSize: 12,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: nightLogFonts.label,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  micro: {
    fontFamily: nightLogFonts.label,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
} as const;

export const nightLogShadows = {
  card: '0 10px 24px rgba(60, 40, 20, 0.12), inset 0 1px 0 rgba(255, 250, 238, 0.8)',
  pop: '0 18px 36px rgba(60, 40, 20, 0.18), inset 0 1px 0 rgba(255, 250, 238, 0.8)',
  press: 'inset 0 2px 5px rgba(60, 40, 20, 0.12)',
} as const;

export const nightLogMotion = {
  fast: 120,
  base: 180,
  slow: 320,
  easeOut: 'cubic-bezier(.2,.7,.3,1)',
  easeInOut: 'cubic-bezier(.45,.05,.55,.95)',
  caretBlink: 1100,
} as const;

export const nightLogLayout = {
  mobileGutter: nightLogSpacing.s5,
  verticalCardGap: 14,
  sectionSpacing: nightLogSpacing.s6,
  statusBarSpace: 60,
  cardPadding: nightLogSpacing.s4,
  cardTiltMax: 0.4,
} as const;

export const nightLogTheme = {
  colors: nightLogColors,
  spacing: nightLogSpacing,
  radius: nightLogRadius,
  radii: nightLogRadius,
  fonts: nightLogFonts,
  type: nightLogType,
  shadows: nightLogShadows,
  motion: nightLogMotion,
  layout: nightLogLayout,
} as const;
