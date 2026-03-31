import { createTempCanvas } from "./canvasHelpers";
import { drawImagesOnCanvas, loadImages } from "./canvasDraw";

/**
 * Renders all images at their native resolution (no zoom) and returns
 * a data-URL string via the provided callback.
 */
export function saveImage(
  imageList: string[],
  cb: (dataUrl: string | undefined) => void,
) {
  loadImages(imageList).then(({ loaded }) => {
    if (loaded.length === 0) {
      cb(undefined);
      return;
    }
    const refW = loaded[0].naturalWidth || loaded[0].width;
    const refH = loaded[0].naturalHeight || loaded[0].height;
    const { tempCanvas } = createTempCanvas(undefined, refW, refH);
    drawImagesOnCanvas(tempCanvas, loaded, 1, 0.5, 0.5);
    cb(tempCanvas.toDataURL("image/png"));
  });
}

/**
 * Renders all images at their native resolution, then returns the full
 * canvas as a compressed Blob via the provided callback.
 */
export function saveImageBlobCompressed(
  imageList: string[],
  cb: (imageData: Blob | null) => void,
  format?: "image/png" | "image/jpeg" | "image/webp",
  quality?: number,
) {
  loadImages(imageList).then(({ loaded }) => {
    if (loaded.length === 0) {
      cb(null);
      return;
    }
    const refW = loaded[0].naturalWidth || loaded[0].width;
    const refH = loaded[0].naturalHeight || loaded[0].height;
    const { tempCanvas } = createTempCanvas(undefined, refW, refH);
    drawImagesOnCanvas(tempCanvas, loaded, 1, 0.5, 0.5);

    const mimeType = format ?? "image/png";
    if (mimeType === "image/png") {
      tempCanvas.toBlob((data) => cb(data), mimeType);
    } else {
      tempCanvas.toBlob((data) => cb(data), mimeType, quality ?? 0.85);
    }
  });
}
