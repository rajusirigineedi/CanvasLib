export function debounceFn<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
) {
  let timer: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      requestAnimationFrame(() => {
        // @ts-ignore
        fn.apply(this, args);
      });
    }, ms);
  };
}
