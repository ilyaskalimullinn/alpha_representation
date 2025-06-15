import { createApp } from "vue";
import "@/style.css";
import SValues from "@/views/SValues.vue";
import VueKonva from "vue-konva";
import { createPinia } from "pinia";

const app = createApp(SValues);
const pinia = createPinia();

app.use(pinia);
app.use(VueKonva);
app.mount("#app");
