# fitt-canvas

## Version 4 contract

`CustomizerProduct` uses flat `variants` and a string `defaultVariantId`; `CustomizerCreation` uses `productTemplateId` and `selectedVariantId`. `RenderLayer.variantId` matches the stable source variant ID. `deriveImageList` accepts an optional `variantId` override and uses explicit render layers. Fabric/shade arrays, positional material selection, URL substitution and `substituteMaterial` were removed. Backend prices remain authoritative.

This version is distributed locally to the Fitt clients. Run `npm test`, then `npm pack --pack-destination /tmp`, copy `fitt-canvas-4.0.0.tgz` to each client's `vendor/`, and update the package/lockfile dependency. No npm publication is required.


A shared product-customizer and layered-image renderer for browser and React Native applications.

[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5%20Canvas-EDD81C?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)

## Architecture

The package has three supported entry points:

- `fitt-canvas/core` contains platform-independent geometry, zoom animation, layer derivation, option rules, totals, and creation payload logic.
- `fitt-canvas/web` contains the HTML Canvas renderer and browser helpers.
- `fitt-canvas/native` contains the React Native Skia renderer and native image capture.

The root `fitt-canvas` entry remains an alias for the browser API so existing web consumers continue to work.

Both renderers use the same frame calculations and animation rules. Image decoding, drawing, and snapshot encoding stay inside the appropriate platform adapter.

## Browser renderer

Pass an ordered list of image URLs and the browser renderer composites them on an HTML Canvas. It handles:

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

### Basic usage

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

The explicit browser entry is also available:

```tsx
import { Canvas } from "fitt-canvas/web";
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

### Canvas props

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

### Browser utilities

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

## React Native renderer

The native entry uses `@shopify/react-native-skia`. The consuming Expo or React Native application must install compatible versions of React Native Skia and the three Hermanhood font packages declared as optional peers.

```tsx
import { useRef } from "react";
import {
  FittCanvas,
  type FittCanvasHandle,
} from "fitt-canvas/native";

const canvasRef = useRef<FittCanvasHandle>(null);

<FittCanvas
  ref={canvasRef}
  width={canvasWidth}
  height={canvasHeight}
  imageList={images}
  zoom={1.6}
  focusX={0.5}
  focusY={-0.25}
  monogram={selectedMonogram}
/>;

const pngBase64 = await canvasRef.current?.capturePngBase64();
```

## Shared customizer engine

Builder state calculations can run in any consumer without importing either renderer:

```ts
import {
  deriveImageList,
  getCustomizerTotal,
  getDisabledOptions,
  selectGroupOption,
  zoomPresets,
} from "fitt-canvas/core";
```

Changes to layer selection, material substitution, option compatibility, totals, or zoom presets now ship once in this package.

## Release workflow

Run the contract tests before publishing:

```bash
npm test
npm pack --dry-run
```

During local development, sibling applications can depend on `file:../CanvasLib`. For deployed applications, publish the package and replace the file dependency with the exact released version, such as `3.0.0`.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

&copy; 2023 raju sirigineedi | ravitejasunkara | charanbolisetti
