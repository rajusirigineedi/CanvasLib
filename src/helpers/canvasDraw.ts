import { copyToCanvas, createTempCanvas } from "./canvasHelpers";

// ---------------------------------------------------------------------------
// Image cache – avoids re-decoding the same URL on every draw call.
// ---------------------------------------------------------------------------
const IMAGE_CACHE_MAX = 200;
const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(src: string): HTMLImageElement {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const image = new Image();
  image.crossOrigin = "Anonymous";
  image.src = src;

  if (imageCache.size >= IMAGE_CACHE_MAX) {
    const firstKey = imageCache.keys().next().value!;
    imageCache.delete(firstKey);
  }
  imageCache.set(src, image);
  return image;
}

/** Clear the internal image cache. */
export function clearImageCache() {
  imageCache.clear();
}

// ---------------------------------------------------------------------------
// Core drawing – dimension-agnostic, driven entirely by caller params
// ---------------------------------------------------------------------------

/**
 * Draws pre-loaded images stacked on top of each other onto `canvas`,
 * scaled and positioned by zoom/focus parameters.
 *
 * Images are fit to the canvas (contain mode) then scaled by `zoom`.
 * `focusX`/`focusY` (0–1) control which part of the image stays centered
 * when zoomed beyond the canvas bounds.
 */
export function drawImagesOnCanvas(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
  zoom: number,
  focusX: number,
  focusY: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx || images.length === 0) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Use first image as reference for native dimensions.
  const imgNativeW = images[0].naturalWidth || images[0].width;
  const imgNativeH = images[0].naturalHeight || images[0].height;
  if (imgNativeW === 0 || imgNativeH === 0) return;

  // Contain-fit: scale image to fit inside canvas, then multiply by zoom.
  const baseScale = Math.min(
    canvas.width / imgNativeW,
    canvas.height / imgNativeH,
  );
  const scaledW = imgNativeW * baseScale * zoom;
  const scaledH = imgNativeH * baseScale * zoom;

  // Focus offset: controls which part is visible when zoomed past canvas edges.
  // focusX/Y = 0.5 → centered. 0 → left/top edge. 1 → right/bottom edge.
  const overflowX = Math.max(0, scaledW - canvas.width);
  const overflowY = Math.max(0, scaledH - canvas.height);
  const x = (canvas.width - scaledW) / 2 + overflowX * (0.5 - focusX);
  const y = (canvas.height - scaledH) / 2 + overflowY * (0.5 - focusY);

  for (let i = 0; i < images.length; i++) {
    ctx.drawImage(images[i], x, y, scaledW, scaledH);
  }
}

// ---------------------------------------------------------------------------
// Image loading
// ---------------------------------------------------------------------------

/**
 * Loads all images from URLs using the internal cache.
 * Returns loaded HTMLImageElements and a list of URLs that failed.
 */
export async function loadImages(urls: string[]): Promise<{
  loaded: HTMLImageElement[];
  failed: string[];
}> {
  const images: HTMLImageElement[] = [];
  const failed: string[] = [];

  const results = await Promise.allSettled(
    urls.map(async (src) => {
      const image = getCachedImage(src);
      await image.decode();
      return image;
    }),
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      images.push(result.value);
    } else {
      failed.push(urls[i]);
      imageCache.delete(urls[i]);
    }
  }

  return { loaded: images, failed };
}

// ---------------------------------------------------------------------------
// Public convenience API
// ---------------------------------------------------------------------------

/**
 * Loads and draws images (by URL) stacked onto a canvas, with zoom/focus.
 * Uses double-buffering for flicker-free updates.
 */
export async function drawOnCanvas(
  canvasElement: HTMLCanvasElement,
  imageList: string[],
  zoom: number = 1,
  focusX: number = 0.5,
  focusY: number = 0.5,
  onDrawComplete?: () => void,
  onImageError?: (failedUrls: string[]) => void,
) {
  if (!canvasElement || !canvasElement.width || !canvasElement.height) return;

  const { tempCanvas } = createTempCanvas(canvasElement);
  const { loaded, failed } = await loadImages(imageList);

  if (failed.length > 0) onImageError?.(failed);
  if (loaded.length === 0) return;

  drawImagesOnCanvas(tempCanvas, loaded, zoom, focusX, focusY);

  requestAnimationFrame(() => {
    copyToCanvas(tempCanvas, canvasElement);
    onDrawComplete?.();
  });
}
