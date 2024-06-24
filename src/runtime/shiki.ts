import { unwrapTransformer } from "./transforms";
import type { HighlightOptions, ShikiHighlighter, ShikiOptions } from "./types";

const _importShikiCore = cached(() => import("shiki/core"));
const _importWasm = cached(() => import("shiki/wasm"));
const _importShikiOptions = cached(() => import("shiki-options.mjs"));

const createCacheStore = <T>(args: any[]) => {
  /* eslint-disable no-multi-assign */
  const globalCache: Record<string, CacheStore<T>> = ((
    globalThis as any
  ).__NUXT_SHIKI__ ??= {});
  const key: string = args[0] || "default";
  return (globalCache[key] ??= {});
};

export const createHighlighter = cached<ShikiHighlighter>(
  async () => {
    const [{ createHighlighterCore }, wasm, { shikiOptions }] = await Promise.all([
      _importShikiCore(),
      _importWasm(),
      _importShikiOptions()
    ]);

    const highlighter = (await createHighlighterCore({
      ...shikiOptions.core,
      loadWasm: wasm
    })) as ShikiHighlighter;

    highlighter.highlight = (code, highlightOptions) => {
      return highlighter.codeToHtml(code, resolveOptions(shikiOptions, highlightOptions));
    };

    return highlighter;
  },
  createCacheStore
);

export const createOptions = cached<ShikiOptions>(
  async () => {
    const { shikiOptions } = await _importShikiOptions();
    return shikiOptions;
  },
  createCacheStore
);

export function resolveOptions(shikiOptions: ShikiOptions, highlightOptions: HighlightOptions = {}) {
  return {
    ...shikiOptions.highlight,
    ...highlightOptions,
    transformers: [
      ...((highlightOptions.unwrap) ? [unwrapTransformer] : []),
      ...(highlightOptions.transformers || [])
    ]
  };
}

// ---- cache utils ---

type Fn<T> = (...args: any[]) => T;
type MaybePromise<T> = T | Promise<T>;
interface CacheStore<T> {
  promise?: T | Promise<T>;
  value?: T;
}
function cached<T>(
  fn: Fn<MaybePromise<T>>,
  getStore?: (args: Parameters<typeof fn>) => CacheStore<T>
): Fn<MaybePromise<T>> {
  const _store: CacheStore<T> | undefined = getStore ? void 0 : {};
  return function(...args: any[]) {
    const store = _store || getStore!(args);
    if (store.value !== void 0) {
      return store.value;
    }
    if (store.promise) {
      return store.promise;
    }
    const res = fn(...args);
    if (res instanceof Promise) {
      store.promise = res.then((value) => {
        store.value = value;
        delete store.promise;
        return value;
      });
      return store.promise;
    }
    return store.promise!;
  };
}