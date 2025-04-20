import { createApp } from "vue";
import "@/style.css";
import About from "@/views/About.vue";
import VueKonva from "vue-konva";
import { createPinia } from "pinia";

const app = createApp(About);
const pinia = createPinia();

app.use(pinia);
app.use(VueKonva);
app.mount("#app");
