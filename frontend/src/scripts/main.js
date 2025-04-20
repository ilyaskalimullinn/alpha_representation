import { createApp } from "vue";
import "@/style.css";
import App from "@/views/App.vue";
import VueKonva from "vue-konva";
import { createPinia } from "pinia";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(VueKonva);
app.mount("#app");
