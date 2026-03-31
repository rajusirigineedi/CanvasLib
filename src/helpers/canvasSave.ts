import { createTempCanvas } from "./canvasHelpers";
import { drawImagesOnCanvas, loadImages } from "./canvasDraw";

/**
 * Resolves output canvas dimensions.
 * If explicit width/height are provided, uses those.
 * Otherwise falls back to the first image's native resolution.
 */
function resolveOutputSize(
  loaded: HTMLImageElement[],
  outputWidth?: number,
  outputHeight?: number,
): { w: number; h: number } {
  if (outputWidth && outputHeight) return { w: outputWidth, h: outputHeight };
  const refW = loaded[0].naturalWidth || loaded[0].width;
  const refH = loaded[0].naturalHeight || loaded[0].height;
  return { w: refW, h: refH };
}

/**
 * Renders all images and returns a data-URL string via the provided callback.
 *
 * When `outputWidth` / `outputHeight` are given the canvas is created at that
 * size and contain-fit scaling ensures the full image is visible (great for
 * preview thumbnails). Otherwise native image resolution is used.
 */
export function saveImage(
  imageList: string[],
  cb: (dataUrl: string | undefined) => void,
  outputWidth?: number,
  outputHeight?: number,
) {
  loadImages(imageList).then(({ loaded }) => {
    if (loaded.length === 0) {
      cb(undefined);
      return;
    }
    const { w, h } = resolveOutputSize(loaded, outputWidth, outputHeight);
    const { tempCanvas } = createTempCanvas(undefined, w, h);
    drawImagesOnCanvas(tempCanvas, loaded, 1, 0.5, 0.5);
    cb(tempCanvas.toDataURL("image/png"));
  });
}

/**
 * Renders all images, then returns the full canvas as a compressed Blob via
 * the provided callback.
 *
 * When `outputWidth` / `outputHeight` are given the canvas is created at that
 * size and contain-fit scaling ensures the full image is visible (great for
 * preview thumbnails). Otherwise native image resolution is used.
 */
export function saveImageBlobCompressed(
  imageList: string[],
  cb: (imageData: Blob | null) => void,
  format?: "image/png" | "image/jpeg" | "image/webp",
  quality?: number,
  outputWidth?: number,
  outputHeight?: number,
) {
  loadImages(imageList).then(({ loaded }) => {
    if (loaded.length === 0) {
      cb(null);
      return;
    }
    const { w, h } = resolveOutputSize(loaded, outputWidth, outputHeight);
    const { tempCanvas } = createTempCanvas(undefined, w, h);
    drawImagesOnCanvas(tempCanvas, loaded, 1, 0.5, 0.5);

    const mimeType = format ?? "image/png";
    if (mimeType === "image/png") {
      tempCanvas.toBlob((data) => cb(data), mimeType);
    } else {
      tempCanvas.toBlob((data) => cb(data), mimeType, quality ?? 0.85);
    }
  });
}
