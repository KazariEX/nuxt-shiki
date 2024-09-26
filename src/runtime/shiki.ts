import defu from "defu";
import type { NuxtApp } from "nuxt/app";
import { unwrapTransformer } from "./transforms";
import type { HighlightOptions, ShikiHighlighter, ShikiOptions } from "./types";

const _importShikiCore = cached(() => import("shiki/core"));
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
        const [{ createHighlighterCore, createJavaScriptRegexEngine }, { shikiOptions }] = await Promise.all([
            _importShikiCore(),
            _importShikiOptions()
        ]);

        const highlighter = (await createHighlighterCore({
            ...shikiOptions.core,
            engine: createJavaScriptRegexEngine()
        })) as ShikiHighlighter;

        highlighter.highlight = (code, highlightOptions) => {
            return highlighter.codeToHtml(code, resolveOptions(shikiOptions, highlightOptions));
        };

        return highlighter;
    },
    createCacheStore
);

export const createOptions = cached<ShikiOptions>(
    async (_, nuxtApp: NuxtApp) => {
        const { shikiOptions } = await _importShikiOptions();
        await nuxtApp.callHook("shiki:options", {
            options: shikiOptions.highlight,
            extend: (options) => {
                // FIXME: type check is too slow
                shikiOptions.highlight = (defu as any)(options, shikiOptions.highlight) as HighlightOptions;
            }
        });
        return shikiOptions;
    },
    createCacheStore
);

export function resolveOptions(shikiOptions: ShikiOptions, highlightOptions: Partial<HighlightOptions> = {}) {
    // FIXME: type check is too slow
    const options = (defu as any)(highlightOptions, shikiOptions.highlight) as HighlightOptions;
    const unwrap = highlightOptions.unwrap ?? shikiOptions.highlight.unwrap ?? false;
    if (unwrap) {
        (options.transformers ??= []).unshift(unwrapTransformer);
    }
    return options;
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