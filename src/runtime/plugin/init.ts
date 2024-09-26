import { defineNuxtPlugin } from "nuxt/app";
import { createOptions } from "../shiki";

export default defineNuxtPlugin({
    name: "nuxt-shiki:init",
    setup(nuxtApp) {
        createOptions("_options", nuxtApp);
    }
});