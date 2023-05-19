import { createTempCanvas } from "./canvasHelpers";
import { drawOnCanvas } from "./canvasDraw";
import { DIMENSIONS, imageHeight, imageWidth } from "../constants";

function imageDataToImageURL(imagedata?: ImageData) {
  if (!imagedata) return;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext("2d");
  canvas.width = imagedata.width;
  canvas.height = imagedata.height;
  ctx?.putImageData(imagedata, 0, 0);

  return canvas.toDataURL();
}

export function saveImage(imageList: string[]) {
  // Give some Desktop width and height so that all saved images are of same dimensions.
  // passing undefined coz we are creating a new canvas out of nothing.
  const { tempCanvas, tempCtx } = createTempCanvas(
    undefined,
    DIMENSIONS.DESKTOP.WIDTH * 2,
    DIMENSIONS.DESKTOP.HEIGHT * 2
  );
  // draw all the content to the temp canvas.
  drawOnCanvas(tempCanvas, imageList, "none", () => {
    const imageData = tempCtx?.getImageData(
      tempCanvas.width / 2 - imageWidth / 2,
      tempCanvas.height / 2 - imageHeight / 2,
      imageWidth,
      imageHeight
    );
    console.log("imag data ", imageData);
    const imageDataURL = imageDataToImageURL(imageData);
    console.log("imageURL ", imageDataURL);
    return imageDataURL;
  });
}
