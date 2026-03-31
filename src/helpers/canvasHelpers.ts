/** Returns the backing-store [width, height] of a canvas. */
export function getCanvasGridDimensions(
  canvas: HTMLCanvasElement,
): [number, number] {
  return [canvas.width, canvas.height];
}

/**
 * Creates an off-screen canvas (used for double-buffering to prevent flicker).
 * Matches the backing-store dimensions of `canvasElement`, or uses explicit `width`/`height`.
 */
export function createTempCanvas(
  canvasElement?: HTMLCanvasElement,
  width?: number,
  height?: number,
) {
  const tempCanvas = document.createElement("canvas");
  if (canvasElement) {
    tempCanvas.width = canvasElement.width;
    tempCanvas.height = canvasElement.height;
  }
  if (width) tempCanvas.width = width;
  if (height) tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");
  return { tempCanvas, tempCtx };
}

/**
 * Copies the full contents of one canvas to another (same-size blit).
 * Clears the destination before drawing.
 */
export function copyToCanvas(
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
) {
  const toCanvasCtx = toCanvas.getContext("2d");
  if (!toCanvasCtx) return;
  toCanvasCtx.clearRect(0, 0, toCanvas.width, toCanvas.height);
  toCanvasCtx.drawImage(fromCanvas, 0, 0);
}
