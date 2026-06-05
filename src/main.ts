import { createApp } from "vue";

import App from "@/App.vue";
import { i18n, initializeAppLocale } from "@/i18n";
import "@/styles/app.css";

initializeAppLocale();

createApp(App).use(i18n).mount("#app");
