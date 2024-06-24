import { type PropType, type Ref, defineComponent, getCurrentInstance, h, ref } from "vue";
import type { BundledLanguage } from "shiki";
import { useShikiHighlighted } from "./utils";
import type { UseHighlightOptions } from "./types";

export default defineComponent({
  props: {
    code: String,
    lang: String as PropType<BundledLanguage>,
    highlightOptions: Object as PropType<UseHighlightOptions>,
    as: { type: String, default: "pre" },
    unwrap: { type: Boolean, default: void 0 }
  },
  async setup(props) {
    const el = ref() as Ref<HTMLElement>;

    const hydratedCode = import.meta.client
      ? getCurrentInstance()?.vnode?.el?.innerHTML
      : void 0;

    const highlighted = await useShikiHighlighted(() => props.code, {
      lang: () => props.lang,
      highlighted: hydratedCode,
      unwrap: props.unwrap ?? props.as === "pre",
      ...props.highlightOptions
    });

    return { el, highlighted };
  },
  render() {
    return h(this.as, {
      innerHTML: this.highlighted,
      ref: "el"
    });
  }
});