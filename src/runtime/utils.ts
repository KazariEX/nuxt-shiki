import type { BundledLanguage, CodeToHastOptions } from "shiki";
import { type MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { createHighlighter, createOptions, resolveOptions } from "./shiki";
import type { HighlightOptions, ShikiHighlighter, UseHighlightOptions } from "./types";

/**
 * Lazy-load shiki instance.
 *
 * You can use this utility both in `server/` and vue app code.
 *
 * @example
 * ```vue
 * <script setup>
 * const highlighter = await getShikiHighlighter()
 * const html = highlighter.highlight(`const hello = 'shiki'`, { lang: 'js' })
 * </script>
 * ```
 *
 * @example
 * ```ts
 * // server/api/highlight.ts
 * export default defineEventHandler(async (event) => {
 *   const highlighter = await getShikiHighlighter()
 *   return highlighter.highlight(`const hello = 'shiki'`, { lang: 'js' })
 * })
 * ```
 */
export async function getShikiHighlighter(): Promise<ShikiHighlighter> {
  return createHighlighter("_instance");
}

/**
 * Resolve `highlightOptions` with defaults.
 *
 * @example
 * ```
 * const shiki = await getShikiHighlighter()
 * const options = await resolveShikiOptions({ lang: 'js' })
 * const hast = shiki.codeToHast(`const hello = 'shiki'`, options)
 * ```
 */
export async function resolveShikiOptions(highlightOptions: HighlightOptions = {}): Promise<CodeToHastOptions> {
  const shikiOptions = await createOptions("_options");
  return resolveOptions(shikiOptions, highlightOptions);
}

/**
 * Return a lazy highlighted code ref (only usable in Vue)
 *
 * @example
 * ```vue
 * <script setup>
 * const code = ref(`const hello = 'shiki'`)
 * const highlighted = await useShikiHighlighted(code)
 * </script>
 * ```
 */
export async function useShikiHighlighted(
  code: MaybeRefOrGetter<string | undefined>,
  options: UseHighlightOptions = {}
) {
  if ("themes" in options && !options.themes) {
    delete options.themes;
  }

  if (import.meta.server) {
    const highlighter = await getShikiHighlighter();
    return ref(highlighter.highlight(toValue(code) || "", {
      ...options,
      lang: toValue(options.lang),
      theme: toValue(options.theme)
    }));
  }

  const highlighted = ref(options.highlighted || "");
  const immediate = !highlighted.value;

  watch([
    () => toValue(code),
    () => toValue(options.lang),
    () => toValue(options.theme)
  ], async ([_code, lang, theme]) => {
    const highlighter = await getShikiHighlighter();
    highlighted.value = highlighter.highlight(_code || "", {
      ...options,
      lang,
      theme
    });
  }, {
    immediate
  });

  return highlighted;
}

/**
 * Dynamically loading languages when `options.dynamic` is true.
 *
 * @example
 * ```vue
 * <script setup>
 * await loadShikiLanguages("tsx", "vue")
 * </script>
 * ```
 */
export async function loadShikiLanguages(...langs: string[]) {
  const { bundledLanguages } = await import("shiki/langs");
  const highlighter = await getShikiHighlighter();
  const loadedLanguages = highlighter.getLoadedLanguages();
  await Promise.all(
    langs
      .filter((lang) => !loadedLanguages.includes(lang))
      .map((lang) => bundledLanguages[lang as BundledLanguage])
      .filter(Boolean)
      .map((dynamicLang) => new Promise<void>((resolve) => {
        dynamicLang().then((loadedLang) => {
          highlighter.loadLanguage(loadedLang).then(() => resolve());
        });
      }))
  );
}