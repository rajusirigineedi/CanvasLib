/**
 * Creates a debounced version of a function that delays invocation until
 * `ms` milliseconds have elapsed since the last call. The final invocation
 * is scheduled inside a `requestAnimationFrame` for smooth rendering.
 */
export function debounceFn<T extends (...args: any[]) => any>(
  fn: T,
  ms: number,
) {
  let timer: ReturnType<typeof setTimeout>;
  let rafId: number;
  const debounced = function (this: any, ...args: Parameters<T>) {
    clearTimeout(timer);
    if (rafId) cancelAnimationFrame(rafId);
    timer = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        fn.apply(this, args);
      });
    }, ms);
  };
  /** Cancel any pending debounced call. */
  debounced.cancel = () => {
    clearTimeout(timer);
    if (rafId) cancelAnimationFrame(rafId);
  };
  return debounced;
}
