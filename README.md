# fitt-canvas

A reusable canvas image-stacking library for real-time product customization previews.

## Skills

[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5%20Canvas-EDD81C?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas)

## Description

Pass an ordered list of image URLs and this library composites them on an HTML5 Canvas, producing a stacked product preview (e.g. a trouser with different pockets, stitching, and fabric overlays). It handles:

- **HiDPI / Retina rendering** – uses `devicePixelRatio` so images stay sharp on all screens.
- **Zoom-aware resolution** – pass `renderScale` when CSS-scaling the canvas for zoom so the backing bitmap matches the zoomed size.
- **Image caching** – decoded images are cached internally to avoid redundant network requests.
- **Double-buffered drawing** – renders to an off-screen canvas first, then blits to the visible canvas for flicker-free updates.
- **Responsive** – automatically adjusts to viewport resizes.

## Installation

```bash
npm install fitt-canvas
```

## Usage

### Basic

```tsx
import { Canvas } from "fitt-canvas";

<Canvas
  sidePickerWidth={500}
  bottomPickerHeight={140}
  imageList={[
    "https://example.com/base-layer.png",
    "https://example.com/pocket-layer.png",
    "https://example.com/stitching-layer.png",
  ]}
/>;
```

### With zoom (CSS scale)

When you CSS-transform the canvas for zoom, pass `renderScale` to keep images sharp:

```tsx
<div style={{ transform: "scale(1.5)" }}>
  <Canvas
    sidePickerWidth={440}
    bottomPickerHeight={0}
    imageList={images}
    renderScale={1.5}
    backgroundColor="#f0f4f7"
  />
</div>
```

### Props

| Prop                 | Type                                       | Default     | Description                                        |
| -------------------- | ------------------------------------------ | ----------- | -------------------------------------------------- |
| `sidePickerWidth`    | `number`                                   | _required_  | Pixels reserved for a side panel (desktop only).   |
| `bottomPickerHeight` | `number`                                   | _required_  | Pixels reserved for a bottom panel (mobile only).  |
| `imageList`          | `string[]`                                 | _required_  | Ordered image URLs to stack.                       |
| `translateTo`        | `"none" \| "upper" \| "middle" \| "lower"` | `"none"`    | Zoom/pan region.                                   |
| `backgroundColor`    | `string`                                   | `"#ededed"` | Canvas background color.                           |
| `heightReduce`       | `number`                                   | `0`         | Pixels subtracted from height (e.g. header).       |
| `renderScale`        | `number`                                   | `1`         | Extra multiplier on top of DPR for zoom sharpness. |
| `className`          | `string`                                   | —           | CSS class for the canvas element.                  |
| `style`              | `CSSProperties`                            | —           | Inline styles for the canvas element.              |
| `onDrawComplete`     | `() => void`                               | —           | Callback after all images are drawn.               |
| `onImageError`       | `(urls: string[]) => void`                 | —           | Callback with URLs that failed to load.            |

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

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

&copy; 2023 raju sirigineedi | ravitejasunkara | charanbolisetti
