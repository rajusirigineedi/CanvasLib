import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
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
