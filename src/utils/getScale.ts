import { getDeviceScreenMode } from "./getDeviceScreenMode";

/**
 * Returns scale factors for drawing images on the canvas, based on viewport size.
 *
 * @returns A tuple of:
 *   - `dimensionReduceBy` – divides the reference image dimensions (lower = larger image).
 *   - `zoomScale` – multiplier applied when a zoom region is active.
 *   - `adjust` – fine-tuning factor for upper/lower translate offsets.
 */
export function getScale(
  width: number,
  height: number,
): [dimensionReduceBy: number, zoomScale: number, adjust?: number] {
  const { isBigMobile, isDesktop, isMobile, isTablet } =
    getDeviceScreenMode(width);

  if (isMobile || height < 762) return [1.5, 1.6, 2];
  if (isBigMobile) return [1.2, 1.5, 1.8];
  if (isDesktop || isTablet) return [1, 2];
  return [1, 2];
}
