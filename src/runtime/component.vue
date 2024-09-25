<script lang="ts" setup>
    import { getCurrentInstance } from "vue";
    import type { BundledLanguage } from "shiki";
    import { useShikiHighlighted } from "./utils";
    import type { UseHighlightOptions } from "./types";

    const { lang, code, as = "pre", unwrap, highlightOptions } = defineProps<{
        lang?: BundledLanguage;
        code?: string;
        as?: string;
        unwrap?: boolean;
        highlightOptions?: UseHighlightOptions;
    }>();

    const hydratedCode = import.meta.browser
        ? getCurrentInstance()?.vnode?.el?.innerHTML
        : void 0;

    const highlighted = await useShikiHighlighted(() => code, {
        lang: () => lang,
        highlighted: hydratedCode,
        unwrap: unwrap ?? as === "pre",
        ...highlightOptions
    });
</script>

<template>
    <!-- eslint-disable-next-line vue/no-v-text-v-html-on-component -->
    <component :is="as" v-html="highlighted"/>
</template>