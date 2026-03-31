import { DIMENSIONS } from "../constants";

/**
 * Classify the current viewport width into a device category.
 * Uses the breakpoints defined in `DIMENSIONS`.
 */
export function getDeviceScreenMode(width: number) {
  const isDesktop = width > DIMENSIONS.DESKTOP.WIDTH;
  const isTablet =
    width > DIMENSIONS.TABLET.WIDTH && width <= DIMENSIONS.DESKTOP.WIDTH;
  const isBigMobile =
    width > DIMENSIONS.BIG_MOBILE.WIDTH && width <= DIMENSIONS.TABLET.WIDTH;
  const isMobile = width <= DIMENSIONS.BIG_MOBILE.WIDTH;
  return { isTablet, isDesktop, isMobile, isBigMobile };
}
