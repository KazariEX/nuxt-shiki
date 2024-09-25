import type { HookResult } from "@nuxt/schema";
import type { BundledTheme, CodeToHastOptions, HighlighterCore } from "shiki";
import type { HighlighterCoreOptions } from "shiki/core";
import type { MaybeRefOrGetter } from "vue";

export interface ShikiOptions {
    core: HighlighterCoreOptions;
    highlight: HighlightOptions;
}

export type HighlightOptions = CodeToHastOptions & {
    theme?: BundledTheme;
    themes?: Record<string, BundledTheme>;
    /** unwrap pre > code to code */
    unwrap?: boolean;
};

export type UseHighlightOptions = Omit<Partial<HighlightOptions>, "lang" | "theme"> & {
    highlighted?: string;
    lang?: MaybeRefOrGetter<HighlightOptions["lang"] | undefined>;
    theme?: MaybeRefOrGetter<HighlightOptions["theme"]>;
    themes?: MaybeRefOrGetter<HighlightOptions["themes"]>;
};

export type ShikiHighlighter = HighlighterCore & {
    highlight: (code: string, options: Partial<HighlightOptions>) => string;
};

declare module "nuxt/app" {
    export interface RuntimeNuxtHooks {
        "shiki:options": (ctx: {
            options: HighlightOptions;
            extend: (options: Partial<HighlightOptions>) => void;
        }) => HookResult;
    }
}