# fitt-canvas

A reusable canvas image-stacking library for real-time product customization previews.

[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5%20Canvas-EDD81C?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)

## Description

Pass an ordered list of image URLs and this library composites them on an HTML5 Canvas, producing a stacked product preview (e.g. a trouser with different pockets, stitching, and fabric overlays). It handles:

- **Dimension-agnostic** – consumer provides `width` and `height`; no hardcoded layout constants.
- **Animated zoom & focus** – smooth spring-style transitions via `requestAnimationFrame` when `zoom`, `focusX`, or `focusY` change.
- **HiDPI / Retina rendering** – uses `devicePixelRatio` (and optional `renderScale`) so images stay sharp on all screens.
- **Image caching** – decoded images are cached internally (up to 200 entries) to avoid redundant network requests.
- **Flicker-free drawing** – renders to an off-screen buffer, then blits to the visible canvas.
- **Thumbnail export** – `saveImageBlobCompressed` accepts optional output dimensions for card-friendly preview images.

## Installation

```bash
npm install fitt-canvas
```

## Usage

### Basic

```tsx
import { Canvas } from "fitt-canvas";

<Canvas
  width={800}
  height={600}
  imageList={[
    "https://example.com/base-layer.png",
    "https://example.com/pocket-layer.png",
    "https://example.com/stitching-layer.png",
  ]}
/>;
```

### With zoom and animated transitions

```tsx
<Canvas
  width={canvasWidth}
  height={canvasHeight}
  imageList={images}
  zoom={2}
  focusX={0.5}
  focusY={0.25}
  backgroundColor="#f0f4f7"
  transitionDuration={300}
/>
```

### Canvas Props

| Prop                 | Type               | Default     | Description                                                                 |
| -------------------- | ------------------ | ----------- | --------------------------------------------------------------------------- |
| `width`              | `number`           | _required_  | Width of the canvas container in CSS pixels.                                |
| `height`             | `number`           | _required_  | Height of the canvas container in CSS pixels.                               |
| `imageList`          | `string[]`         | _required_  | Ordered image URLs to stack/composite.                                      |
| `zoom`               | `number`           | `1`         | Zoom level. `1` = fit image to container, `>1` = zoom in.                  |
| `focusX`             | `number`           | `0.5`       | Horizontal focus point when zoomed (0 = left, 0.5 = center, 1 = right).    |
| `focusY`             | `number`           | `0.5`       | Vertical focus point when zoomed (0 = top, 0.5 = center, 1 = bottom).      |
| `backgroundColor`    | `string`           | `"#ededed"` | Canvas background color.                                                    |
| `renderScale`        | `number`           | `1`         | Extra DPR multiplier for crisper rendering at the cost of memory.           |
| `transitionDuration` | `number`           | `300`       | Duration in ms for animated zoom/focus transitions. `0` = instant.          |
| `className`          | `string`           | —           | CSS class for the canvas element.                                           |
| `style`              | `CSSProperties`    | —           | Inline styles for the canvas element.                                       |
| `onDrawComplete`     | `() => void`       | —           | Callback after all images are drawn.                                        |
| `onImageError`       | `(urls: string[]) => void` | —  | Callback with URLs that failed to load.                                     |

### Utilities

```ts
import {
  saveImage,
  saveImageBlobCompressed,
  clearImageCache,
  getDeviceScreenMode,
  useWindowSize,
} from "fitt-canvas";
```

#### `saveImageBlobCompressed`

Composites all images and returns the result as a `Blob`.

```ts
saveImageBlobCompressed(
  imageList,        // string[] – image URLs
  callback,         // (blob: Blob | null) => void
  format?,          // "image/png" | "image/jpeg" | "image/webp"
  quality?,         // number (0–1, for jpeg/webp)
  outputWidth?,     // number – optional thumbnail width
  outputHeight?,    // number – optional thumbnail height
);
```

When `outputWidth` / `outputHeight` are provided, the canvas is created at that size and images are contain-fitted into it — ideal for generating card preview thumbnails.

#### `saveImage`

Same as above but returns a data-URL string instead of a Blob. Also accepts optional `outputWidth` / `outputHeight`.

#### `useWindowSize`

React hook that returns `[width, height]` of the viewport, debounced.

#### `getDeviceScreenMode`

Returns `{ isDesktop, isTablet, isMobile }` based on a width value.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

&copy; 2023 raju sirigineedi | ravitejasunkara | charanbolisetti
