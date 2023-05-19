// Create a canvas with canvas grid [width, height] and the canvas as [width*2, height*2]
// hold a ref to canvas.

import React, { useEffect, useRef } from "react";
import { debounceFn, getDeviceScreenMode } from "../../utils";
import { translateToType } from "../../types";
import { useWindowSize } from "../../hooks";
import { drawOnCanvas } from "../../helpers";

const debounceDraw = debounceFn(drawOnCanvas, 500);

export default function Canvas(props: {
  sidePickerWidth: number;
  bottomPickerHeight: number;
  imageList: string[];
  translateTo?: translateToType;
  backgroundColor?: string;
}) {
  const {
    imageList,
    translateTo,
    sidePickerWidth,
    bottomPickerHeight,
    backgroundColor,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [width, height] = useWindowSize();

  const isDesktop = getDeviceScreenMode(width).isDesktop;

  const canvasWidth = width - (isDesktop ? sidePickerWidth : 0);
  const canvasHeight = height - (isDesktop ? 0 : bottomPickerHeight);

  const canvasGridWidth = canvasWidth * 2;
  const canvasGridHeight = canvasHeight * 2;

  useEffect(() => {
    if (width === 0 || height === 0 || imageList.length === 0) return;
    debounceDraw(
      canvasRef.current as HTMLCanvasElement,
      imageList,
      translateTo ?? "none"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  useEffect(() => {
    if (imageList.length === 0) return;
    drawOnCanvas(
      canvasRef.current as HTMLCanvasElement,
      imageList,
      translateTo ?? "none"
    );
  }, [imageList, translateTo]);

  return (
    <canvas
      id="my-canvas"
      ref={canvasRef}
      height={canvasGridHeight}
      width={canvasGridWidth}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: backgroundColor ?? "#ededed",
      }}
    />
  );
}

Canvas.defaultProps = {
  sidePickerWidth: 500,
  bottomPickerHeight: 140,
  imageList: [],
};
