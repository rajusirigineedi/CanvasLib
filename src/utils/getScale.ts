import { getDeviceScreenMode } from "./getDeviceScreenMode";

// Add more devices here. if possible.
// this width and height represents the whole broswer width and height.
export function getScale(
  width: number,
  height: number
): [dimensionReduceBy: number, zoomScale: number, adjust?: number] {
  const { isBigMobile, isDesktop, isMobile, isTablet } =
    getDeviceScreenMode(width);
  // [dimensionReduceBy: number, zoomScale: number, adjust?: number]
  // dimensionReduceBy: should be lower for higher screens. ( actually reduces width and height of the image )
  // zoomScale: should be higher for higher screens.
  // adjust: can be adjusted accordingly.
  if (isMobile || height < 762) return [1.5, 1.6, 2];
  if (isBigMobile) return [1.2, 1.5, 1.8];
  if (isDesktop || isTablet) return [1, 2];
  return [1, 2];
}
