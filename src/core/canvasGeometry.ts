export type CanvasViewport = {
  zoom: number;
  focusX: number;
  focusY: number;
};

export type CanvasFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const DEFAULT_CANVAS_VIEWPORT: CanvasViewport = {
  zoom: 1,
  focusX: 0.5,
  focusY: 0.5,
};

export const CANVAS_SETTLE_THRESHOLD = 0.002;

export function resolveCanvasFrame(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  viewport: CanvasViewport,
): CanvasFrame | null {
  if (
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    targetWidth <= 0 ||
    targetHeight <= 0
  ) {
    return null;
  }

  const baseScale = Math.min(
    targetWidth / sourceWidth,
    targetHeight / sourceHeight,
  );
  const width = sourceWidth * baseScale * viewport.zoom;
  const height = sourceHeight * baseScale * viewport.zoom;
  const overflowX = Math.max(0, width - targetWidth);
  const overflowY = Math.max(0, height - targetHeight);

  return {
    x: (targetWidth - width) / 2 + overflowX * (0.5 - viewport.focusX),
    y: (targetHeight - height) / 2 + overflowY * (0.5 - viewport.focusY),
    width,
    height,
  };
}

export function interpolateCanvasViewport(
  current: CanvasViewport,
  target: CanvasViewport,
  elapsedMs: number,
  durationMs: number,
): CanvasViewport {
  if (durationMs <= 0) return { ...target };

  const factor =
    1 - Math.pow(0.001, Math.max(1, elapsedMs) / Math.max(durationMs, 1));
  return {
    zoom: current.zoom + (target.zoom - current.zoom) * factor,
    focusX: current.focusX + (target.focusX - current.focusX) * factor,
    focusY: current.focusY + (target.focusY - current.focusY) * factor,
  };
}

export function isCanvasViewportSettled(
  current: CanvasViewport,
  target: CanvasViewport,
  threshold = CANVAS_SETTLE_THRESHOLD,
): boolean {
  return (
    Math.abs(target.zoom - current.zoom) < threshold &&
    Math.abs(target.focusX - current.focusX) < threshold &&
    Math.abs(target.focusY - current.focusY) < threshold
  );
}

export type MonogramPlacement = {
  x: number;
  y: number;
  fontSize: number;
  angleRadians: number;
};

export function resolveMonogramPlacement(
  record: Record<string, string>,
  targetWidth: number,
  targetHeight: number,
  viewport: CanvasViewport,
  referenceWidth = 800,
  referenceHeight = 1714,
): MonogramPlacement {
  const requestedSize = Number.parseFloat(record.font ?? "16") || 16;
  const scale =
    Math.min(targetWidth / referenceWidth, targetHeight / referenceHeight) *
    viewport.zoom;
  const scaledWidth = referenceWidth * scale;
  const scaledHeight = referenceHeight * scale;
  const originX =
    (targetWidth - scaledWidth) / 2 +
    Math.max(0, scaledWidth - targetWidth) * (0.5 - viewport.focusX);
  const originY =
    (targetHeight - scaledHeight) / 2 +
    Math.max(0, scaledHeight - targetHeight) * (0.5 - viewport.focusY);

  return {
    x: originX + (Number(record.x) || 0) * scale,
    y: originY + (Number(record.y) || 0) * scale,
    fontSize: requestedSize * scale,
    angleRadians: ((Number(record.tilt) || 0) * Math.PI) / 180,
  };
}
