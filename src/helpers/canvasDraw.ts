import { copyToCanvas, createTempCanvas } from "./canvasHelpers";
import {
  getScale,
  getWindowSize,
  imageHeight,
  imageWidth,
  translateToType,
} from "..";

function drawAllImages(
  canvas: HTMLCanvasElement,
  allImages: HTMLImageElement[],
  translateTo: translateToType
) {
  const ctx = canvas.getContext("2d");
  const [width, height] = getWindowSize();
  const [dimensionReduceBy, zoomScale, adjust] = getScale(width, height);
  //   console.log(
  //     ">> actual dimensions ",
  //     width,
  //     height,
  //     " and scale",
  //     dimensionReduceBy,
  //     zoomScale,
  //     adjust
  //   );

  let _imageWidth = imageWidth;
  let _imageHeight = imageHeight;
  _imageWidth /= dimensionReduceBy;
  _imageHeight /= dimensionReduceBy;

  let _xShift = canvas.width / 2;
  let _yShift = canvas.height / 2;

  _imageHeight = _imageHeight * zoomScale;
  _imageWidth = _imageWidth * zoomScale;

  if (translateTo === "upper") {
    _xShift -= _imageWidth / 2;
    _yShift -= _imageHeight / 2;
    _yShift += imageHeight / (2 * (adjust ?? 1));
  } else if (translateTo === "middle") {
    _xShift -= _imageWidth / 2;
    _yShift -= _imageHeight / 2;
  } else if (translateTo === "lower") {
    _xShift -= _imageWidth / 2;
    _yShift -= _imageHeight / 2;
    _yShift -= imageHeight / (2 * (adjust ?? 1));
  } else {
    _imageHeight = _imageHeight / zoomScale;
    _imageWidth = _imageWidth / zoomScale;
    _xShift -= _imageWidth / 2;
    _yShift -= _imageHeight / 2;
  }

  for (let i = 0; i < allImages.length; i++) {
    ctx?.drawImage(allImages[i], _xShift, _yShift, _imageWidth, _imageHeight);
  }
}

async function loadAllImages(allImages: string[]) {
  let resultImageArray: HTMLImageElement[] = [];
  const promiseList = [];
  for (let i = 0; i < allImages.length; i++) {
    const src = allImages[i];
    const image = new Image();
    image.crossOrigin = "Anonymous";
    image.src = src;
    promiseList.push(image.decode());
    resultImageArray.push(image); // add loading image to images array
  }
  await Promise.all(promiseList);
  return resultImageArray;
}

// canvas.width = width * 2;
// canvas.height = height * 2;
export async function drawOnCanvas(
  canvasElement: HTMLCanvasElement,
  imageList: string[],
  translateTo: translateToType,
  onDrawComplete?: () => void
) {
  // if no canvas element. or width or height is 0 return. i.e, for the very first time it happens
  if (!canvasElement || !canvasElement.width || !canvasElement.height) return;

  const { tempCanvas } = createTempCanvas(canvasElement);

  // These are helpful to find the correct dimensions for the screens. these are some rectangular dots accross screen corners.
  // tempCtx?.fillRect(0, 0, 50, 30);
  // tempCtx?.fillRect(
  //   tempCanvas.width / 2 - 25,
  //   tempCanvas.height / 2 - 15,
  //   50,
  //   30
  // );
  // tempCtx?.fillRect(tempCanvas.width - 50, tempCanvas.height - 30, 50, 30);
  // tempCtx?.fillRect(0, tempCanvas.height - 30, 50, 30);
  // tempCtx?.fillRect(tempCanvas.width - 50, 0, 50, 30);

  const resultImageArray = await loadAllImages(imageList);
  drawAllImages(tempCanvas, resultImageArray, translateTo); // call function to start rendering
  setTimeout(() => {
    copyToCanvas(tempCanvas, canvasElement);
    onDrawComplete && onDrawComplete();
  }, 100);
}
