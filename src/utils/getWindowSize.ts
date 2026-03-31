/** Returns [width, height] of the browser viewport. */
export function getWindowSize(): [number, number] {
  return [window.innerWidth, window.innerHeight];
}

/**
 * Returns the effective device pixel ratio, clamped to a sensible range.
 * Accounts for browser zoom and HiDPI/Retina screens.
 */
export function getDevicePixelRatio(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), 4);
}
