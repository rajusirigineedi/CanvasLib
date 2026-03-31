import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * React hook that returns the current window dimensions as `[width, height]`.
 * Updates on window resize.
 */
export function useWindowSize(): [number, number] {
  const [size, setSize] = useState<[number, number]>([0, 0]);
  useIsomorphicEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}
