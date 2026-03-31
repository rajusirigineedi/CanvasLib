/** Props accepted by the Canvas component. */
export interface CanvasProps {
  /** Width of the canvas container in CSS pixels. */
  width: number;
  /** Height of the canvas container in CSS pixels. */
  height: number;
  /** Ordered list of image URLs to stack/composite on the canvas. */
  imageList: string[];
  /** Zoom level. 1 = fit image to container, >1 = zoom in. Default: 1. */
  zoom?: number;
  /** Horizontal focus point when zoomed (0 = left edge, 0.5 = center, 1 = right edge). Default: 0.5. */
  focusX?: number;
  /** Vertical focus point when zoomed (0 = top edge, 0.5 = center, 1 = bottom edge). Default: 0.5. */
  focusY?: number;
  /** Canvas background color. Default: "#ededed". */
  backgroundColor?: string;
  /** Additional CSS class names for the canvas element. */
  className?: string;
  /** Additional inline styles for the canvas element. */
  style?: React.CSSProperties;
  /**
   * Extra DPR multiplier on top of native devicePixelRatio.
   * Increase for crisper rendering at the cost of memory. Default: 1.
   */
  renderScale?: number;
  /**
   * Duration in ms for animated zoom/focus transitions.
   * Set to 0 for instant updates. Default: 300.
   */
  transitionDuration?: number;
  /** Called after all images have been drawn to the canvas. */
  onDrawComplete?: () => void;
  /** Called when one or more images fail to load. */
  onImageError?: (failedUrls: string[]) => void;
}

/** Internal zoom state used for animation interpolation. */
export interface ZoomState {
  zoom: number;
  focusX: number;
  focusY: number;
}
