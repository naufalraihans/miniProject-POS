import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { registerSW } from "virtual:pwa-register";
import "./assets/style.css";

// Check if SW updates exist and automatically reload if needed
const updateSW = registerSW({
  onNeedRefresh() {
    // optional: show a prompt to reload
  },
  onOfflineReady() {
    // optional: show a prompt that app is ready offline
    console.log("App ready to work offline");
  },
});

const app = createApp(App);
app.use(router);
app.mount("#app");
