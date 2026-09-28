import { Epilogue_700Bold } from "@expo-google-fonts/epilogue";
import { Manrope_700Bold } from "@expo-google-fonts/manrope";
import { PlayfairDisplay_600SemiBold } from "@expo-google-fonts/playfair-display";
import {
  Canvas,
  Fill,
  Group,
  Image as SkiaImage,
  ImageFormat,
  Skia,
  Text as SkiaText,
  loadData,
  useFont,
  vec,
  type SkCanvas,
  type SkImage,
} from "@shopify/react-native-skia";
import {
  default as React,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, View } from "react-native";
import {
  DEFAULT_CANVAS_VIEWPORT,
  interpolateCanvasViewport,
  isCanvasViewportSettled,
  resolveCanvasFrame,
  resolveMonogramPlacement,
  type CanvasViewport,
} from "../core";

export type FittCanvasProps = {
  width: number;
  height: number;
  imageList: string[];
  zoom?: number;
  focusX?: number;
  focusY?: number;
  backgroundColor?: string;
  renderScale?: number;
  transitionDuration?: number;
  onDrawComplete?: () => void;
  onImageError?: (failedUrls: string[]) => void;
  monogram?: Record<string, string>;
};

export type FittCanvasHandle = {
  capturePngBase64: () => Promise<string>;
};

type LoadedLayer = { source: string; image: SkImage };

const IMAGE_CACHE_MAX = 200;
const CAPTURE_WIDTH = 800;
const CAPTURE_HEIGHT = 640;
const imageCache = new Map<string, SkImage>();

function getLayerFrame(
  reference: SkImage | undefined,
  width: number,
  height: number,
  viewport: CanvasViewport,
) {
  if (!reference) return null;
  return resolveCanvasFrame(
    reference.width(),
    reference.height(),
    width,
    height,
    viewport,
  );
}

async function loadImage(source: string): Promise<SkImage> {
  const cached = imageCache.get(source);
  if (cached) return cached;

  const data = await Skia.Data.fromURI(source);
  const image = Skia.Image.MakeImageFromEncoded(data);
  data.dispose();
  if (!image) throw new Error(`Could not decode canvas layer: ${source}`);

  if (imageCache.size >= IMAGE_CACHE_MAX) {
    const oldest = imageCache.keys().next().value as string | undefined;
    if (oldest) imageCache.delete(oldest);
  }
  imageCache.set(source, image);
  return image;
}

function resolveFontSource(record: Record<string, string>) {
  if (record.font?.includes("Impact")) return Epilogue_700Bold;
  if (record.font?.includes("Brush Script")) {
    return PlayfairDisplay_600SemiBold;
  }
  return Manrope_700Bold;
}

async function drawCapturedMonogram(
  canvas: SkCanvas,
  record: Record<string, string>,
) {
  if (!record.text) return;

  const placement = resolveMonogramPlacement(
    record,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT,
    DEFAULT_CANVAS_VIEWPORT,
  );
  const typeface = await loadData(resolveFontSource(record), (data) =>
    Skia.Typeface.MakeFreeTypeFaceFromData(data),
  );
  if (!typeface) throw new Error("Could not load the monogram font");

  const font = Skia.Font(typeface, placement.fontSize);
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(record.color || "#000000"));
  canvas.save();
  canvas.rotate(
    (placement.angleRadians * 180) / Math.PI,
    placement.x,
    placement.y,
  );
  canvas.drawText(record.text, placement.x, placement.y, paint, font);
  canvas.restore();
  paint.dispose();
  font.dispose();
  typeface.dispose();
}

async function captureLayerStack(
  layers: LoadedLayer[],
  monogram?: Record<string, string>,
) {
  const frame = getLayerFrame(
    layers[0]?.image,
    CAPTURE_WIDTH,
    CAPTURE_HEIGHT,
    DEFAULT_CANVAS_VIEWPORT,
  );
  if (!frame) throw new Error("Canvas layers are not ready");

  const surface = Skia.Surface.MakeOffscreen(CAPTURE_WIDTH, CAPTURE_HEIGHT);
  if (!surface) throw new Error("Could not create the image capture surface");

  const paint = Skia.Paint();
  try {
    const canvas = surface.getCanvas();
    canvas.clear(Skia.Color("transparent"));
    const destination = Skia.XYWHRect(
      frame.x,
      frame.y,
      frame.width,
      frame.height,
    );
    layers.forEach((layer) => {
      canvas.drawImageRect(
        layer.image,
        Skia.XYWHRect(0, 0, layer.image.width(), layer.image.height()),
        destination,
        paint,
        true,
      );
    });
    if (monogram) await drawCapturedMonogram(canvas, monogram);
    surface.flush();
    const surfaceSnapshot = surface.makeImageSnapshot();
    const snapshot = surfaceSnapshot.makeNonTextureImage() ?? surfaceSnapshot;
    try {
      return snapshot.encodeToBase64(ImageFormat.PNG);
    } finally {
      if (snapshot !== surfaceSnapshot) snapshot.dispose();
      surfaceSnapshot.dispose();
    }
  } finally {
    paint.dispose();
    surface.dispose();
  }
}

function useLayerBatch(
  sources: string[],
  onComplete?: () => void,
  onError?: (failedUrls: string[]) => void,
) {
  const [layers, setLayers] = useState<LoadedLayer[]>([]);
  const request = useRef(0);
  const key = sources.join("\u001f");

  useEffect(() => {
    const requestId = ++request.current;
    if (!sources.length) {
      setLayers([]);
      onComplete?.();
      return;
    }

    void Promise.allSettled(
      sources.map(async (source) => ({
        source,
        image: await loadImage(source),
      })),
    ).then((results) => {
      if (request.current !== requestId) return;
      const next: LoadedLayer[] = [];
      const failed: string[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") next.push(result.value);
        else failed.push(sources[index]);
      });
      if (failed.length) onError?.(failed);
      if (next.length) setLayers(next);
      onComplete?.();
    });
    // The ordered stack is the load identity. Callback changes must not
    // restart image decoding or replace a complete garment with half a stack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return layers;
}

function useAnimatedViewport(target: CanvasViewport, duration: number) {
  const current = useRef(target);
  const animation = useRef<number | null>(null);
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (animation.current) cancelAnimationFrame(animation.current);
    if (duration <= 0) {
      current.current = target;
      setValue(target);
      return;
    }

    let previousTime = performance.now();
    const tick = (time: number) => {
      const next = interpolateCanvasViewport(
        current.current,
        target,
        time - previousTime,
        duration,
      );
      previousTime = time;
      current.current = next;
      setValue(next);

      if (isCanvasViewportSettled(next, target)) {
        current.current = target;
        setValue(target);
        animation.current = null;
      } else {
        animation.current = requestAnimationFrame(tick);
      }
    };
    animation.current = requestAnimationFrame(tick);
    return () => {
      if (animation.current) cancelAnimationFrame(animation.current);
    };
    // Target identity changes on render. Its scalar values are the inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, target.focusX, target.focusY, target.zoom]);

  return value;
}

function MonogramLayer({
  record,
  width,
  height,
  viewport,
}: {
  record: Record<string, string>;
  width: number;
  height: number;
  viewport: CanvasViewport;
}) {
  const placement = resolveMonogramPlacement(
    record,
    width,
    height,
    viewport,
  );
  const font = useFont(resolveFontSource(record), placement.fontSize);

  if (!font || !record.text) return null;
  return (
    <Group
      origin={vec(placement.x, placement.y)}
      transform={[{ rotate: placement.angleRadians }]}
    >
      <SkiaText
        color={record.color || "#000000"}
        font={font}
        text={record.text}
        x={placement.x}
        y={placement.y}
      />
    </Group>
  );
}

export const FittCanvas = forwardRef<FittCanvasHandle, FittCanvasProps>(
  function FittCanvas(
    {
      width,
      height,
      imageList,
      zoom = 1,
      focusX = 0.5,
      focusY = 0.5,
      backgroundColor = "#ededed",
      transitionDuration = 300,
      onDrawComplete,
      onImageError,
      monogram,
    },
    ref,
  ) {
    const captureInProgress = useRef(false);
    const layers = useLayerBatch(imageList, onDrawComplete, onImageError);
    const viewport = useAnimatedViewport(
      { zoom, focusX, focusY },
      transitionDuration,
    );

    useImperativeHandle(
      ref,
      () => ({
        capturePngBase64: async () => {
          if (!layers.length) {
            throw new Error("Canvas layers are not ready");
          }
          if (captureInProgress.current) {
            throw new Error("A canvas snapshot is already in progress");
          }
          captureInProgress.current = true;
          try {
            return await captureLayerStack(layers, monogram);
          } finally {
            captureInProgress.current = false;
          }
        },
      }),
      [layers, monogram],
    );

    const frame = useMemo(
      () => getLayerFrame(layers[0]?.image, width, height, viewport),
      [height, layers, viewport, width],
    );

    return (
      <View style={[styles.clip, { width, height, backgroundColor }]}>
        <Canvas style={{ width, height }}>
          <Fill color={backgroundColor} />
          {frame
            ? layers.map((layer) => (
                <SkiaImage
                  fit="fill"
                  image={layer.image}
                  key={layer.source}
                  x={frame.x}
                  y={frame.y}
                  width={frame.width}
                  height={frame.height}
                />
              ))
            : null}
          {monogram ? (
            <MonogramLayer
              height={height}
              record={monogram}
              viewport={viewport}
              width={width}
            />
          ) : null}
        </Canvas>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
});
