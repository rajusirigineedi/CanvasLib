export function getCanvasGridDimensions(canvas: HTMLCanvasElement) {
  return [canvas.width, canvas.height];
}

export function getCanvasActualDimensions(canvas: HTMLCanvasElement) {
  const [width, height] = getCanvasGridDimensions(canvas);
  return [width / 2, height / 2];
}

export function createTempCanvas(
  canvasElement?: HTMLCanvasElement,
  width?: number,
  height?: number
) {
  const tempCanvas = document.createElement("canvas");
  if (canvasElement) {
    tempCanvas.width = canvasElement.width;
    tempCanvas.height = canvasElement.height;
  }
  if (width) tempCanvas.width = width;
  if (height) tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext("2d");
  return { tempCanvas, tempCtx };
}

export function copyToCanvas(
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement
) {
  const toCanvasCtx = toCanvas.getContext("2d");
  toCanvasCtx?.clearRect(0, 0, toCanvas.width, toCanvas.height);
  toCanvasCtx?.drawImage(fromCanvas, 0, 0);
}
