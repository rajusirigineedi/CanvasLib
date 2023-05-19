// Add more devices here. if possible. and give scales as well. in the below function.

import { DIMENSIONS } from "../constants";

// this width and height represents the whole width and height of the browser.
export function getDeviceScreenMode(width: number) {
  const isTablet =
    width > DIMENSIONS.TABLET.WIDTH && width < DIMENSIONS.DESKTOP.WIDTH;
  const isBigMobile =
    width > DIMENSIONS.BIG_MOBILE.WIDTH && width < DIMENSIONS.TABLET.WIDTH;
  const isMobile = width < DIMENSIONS.BIG_MOBILE.WIDTH;
  const isDesktop = width > DIMENSIONS.DESKTOP.WIDTH;
  return { isTablet, isDesktop, isMobile, isBigMobile };
}
