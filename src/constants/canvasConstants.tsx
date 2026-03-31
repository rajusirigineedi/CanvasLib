/** Breakpoint dimensions used for responsive behavior by getDeviceScreenMode. */
export const DIMENSIONS = {
  DESKTOP: {
    SCALE: 1,
    WIDTH: 1170,
    HEIGHT: 936,
  },
  TABLET: {
    SCALE: 0.9,
    WIDTH: 642,
  },
  BIG_MOBILE: {
    SCALE: 0.7,
    WIDTH: 414,
  },
  MOBILE: {
    SCALE: 0.6,
    WIDTH: 414,
  },
} as const;
