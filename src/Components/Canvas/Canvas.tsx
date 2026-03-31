/**
 * Canvas component that composites a list of images on top of each other.
 *
 * Dimension-agnostic: the consumer provides explicit `width` and `height`.
 * Zoom and focus are animated smoothly using a spring-style rAF loop that
 * redraws the canvas at full resolution every frame — no CSS transform hacks.
 */

import React, { useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { getDevicePixelRatio } from "../../utils";
import { CanvasProps, ZoomState } from "../../types";
import { drawImagesOnCanvas, loadImages } from "../../helpers";

const SETTLE_THRESHOLD = 0.002;

export function Canvas(props: CanvasProps) {
  const {
    width,
    height,
    imageList,
    zoom = 1,
    focusX = 0.5,
    focusY = 0.5,
    backgroundColor = "#ededed",
    className,
    style,
    renderScale = 1,
    transitionDuration = 300,
    onDrawComplete,
    onImageError,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadedImagesRef = useRef<HTMLImageElement[]>([]);
  const animRef = useRef<number>(0);

  // Animated state (smoothly tracks targets).
  const currentRef = useRef<ZoomState>({ zoom, focusX, focusY });
  // Target state (set instantly from props).
  const targetRef = useRef<ZoomState>({ zoom, focusX, focusY });
  // Keep callback refs current without triggering animation restarts.
  const onDrawCompleteRef = useRef(onDrawComplete);
  const onImageErrorRef = useRef(onImageError);
  const transitionDurationRef = useRef(transitionDuration);
  onDrawCompleteRef.current = onDrawComplete;
  onImageErrorRef.current = onImageError;
  transitionDurationRef.current = transitionDuration;

  // Backing-store (pixel-buffer) dimensions for crisp rendering.
  const dpr = getDevicePixelRatio();
  const backingScale = dpr * renderScale;
  const canvasGridWidth = Math.round(width * backingScale);
  const canvasGridHeight = Math.round(height * backingScale);

  // ----- draw a single frame at the given state -----
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const images = loadedImagesRef.current;
    if (!canvas || images.length === 0) return;
    drawImagesOnCanvas(
      canvas,
      images,
      currentRef.current.zoom,
      currentRef.current.focusX,
      currentRef.current.focusY,
    );
  }, []);

  // ----- animation loop (spring-style lerp) -----
  const runAnimation = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const tick = () => {
      const canvas = canvasRef.current;
      const images = loadedImagesRef.current;
      if (!canvas || images.length === 0) return;

      const target = targetRef.current;
      const current = currentRef.current;
      const duration = transitionDurationRef.current;

      // Lerp factor: how much of the remaining distance to cover per ~16ms frame.
      const factor =
        duration > 0 ? 1 - Math.pow(0.001, 16 / Math.max(duration, 1)) : 1;

      current.zoom += (target.zoom - current.zoom) * factor;
      current.focusX += (target.focusX - current.focusX) * factor;
      current.focusY += (target.focusY - current.focusY) * factor;

      drawImagesOnCanvas(
        canvas,
        images,
        current.zoom,
        current.focusX,
        current.focusY,
      );

      const settled =
        Math.abs(target.zoom - current.zoom) < SETTLE_THRESHOLD &&
        Math.abs(target.focusX - current.focusX) < SETTLE_THRESHOLD &&
        Math.abs(target.focusY - current.focusY) < SETTLE_THRESHOLD;

      if (settled) {
        // Snap to exact target for precision.
        current.zoom = target.zoom;
        current.focusX = target.focusX;
        current.focusY = target.focusY;
        drawImagesOnCanvas(
          canvas,
          images,
          target.zoom,
          target.focusX,
          target.focusY,
        );
        animRef.current = 0;
        onDrawCompleteRef.current?.();
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  }, []);

  // ----- load images -----
  useEffect(() => {
    if (imageList.length === 0) {
      loadedImagesRef.current = [];
      return;
    }

    let cancelled = false;
    loadImages(imageList).then(({ loaded, failed }) => {
      if (cancelled) return;
      if (failed.length > 0) onImageErrorRef.current?.(failed);

      const hadImages = loadedImagesRef.current.length > 0;
      loadedImagesRef.current = loaded;

      if (!hadImages) {
        // First load — snap to target instantly (no animation to/from nothing).
        currentRef.current = { ...targetRef.current };
      }
      drawFrame();
      onDrawCompleteRef.current?.();
    });

    return () => {
      cancelled = true;
    };
  }, [imageList, drawFrame]);

  // ----- animate when zoom / focus targets change -----
  useEffect(() => {
    targetRef.current = { zoom, focusX, focusY };
    runAnimation();
  }, [zoom, focusX, focusY, runAnimation]);

  // ----- instant redraw on resize (no animation, just repaint) -----
  useLayoutEffect(() => {
    if (loadedImagesRef.current.length === 0) return;
    // Snap to target — resize shouldn't animate.
    currentRef.current = { ...targetRef.current };
    drawFrame();
  }, [canvasGridWidth, canvasGridHeight, drawFrame]);

  // ----- cleanup -----
  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={canvasGridWidth}
      height={canvasGridHeight}
      className={className}
      style={{
        width,
        height,
        backgroundColor,
        display: "block",
        ...style,
      }}
    />
  );
}
