// Create a canvas with canvas grid [width, height] and the canvas as [width*2, height*2]
// hold a ref to canvas.

import { drawOnCanvas } from "@/helpers/canvasDraw";
import { useWindowSize } from "@/hooks/useWindowSize";
import { translateToType } from "@/types/canvastypes";
import { debounceFn } from "@/utils";
import { getDeviceScreenMode } from "@/utils/getDeviceScreenMode";
import React, { useEffect, useRef } from "react";

const debounceDraw = debounceFn(drawOnCanvas, 500);

export default function Canvas(props: {
  sidePickerWidth: number;
  bottomPickerHeight: number;
  imageList: string[];
  translateTo?: translateToType;
}) {
  const { imageList, translateTo, sidePickerWidth, bottomPickerHeight } = props;
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
    <div className="relative">
      <div className="w-screen h-2 bg-red-700 absolute z-50 top-[49.6%]"></div>
      <canvas
        id="my-canvas"
        ref={canvasRef}
        height={canvasGridHeight}
        width={canvasGridWidth}
        className="bg-blue-500"
        style={{
          width: canvasWidth,
          height: canvasHeight,
        }}
      />
    </div>
  );
}

Canvas.defaultProps = {
  sidePickerWidth: 500,
  bottomPickerHeight: 140,
  imageList: [],
};
