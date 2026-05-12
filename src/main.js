import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { registerSW } from "virtual:pwa-register";
import "./assets/style.css";
import { isAndroidApp, isNativePlatform, shouldRegisterServiceWorker } from "./services/platform";

document.documentElement.classList.toggle("native-shell", isNativePlatform());
document.documentElement.classList.toggle("android-shell", isAndroidApp());
document.body.classList.toggle("native-shell", isNativePlatform());
document.body.classList.toggle("android-shell", isAndroidApp());

if (shouldRegisterServiceWorker()) {
  registerSW({
    onNeedRefresh() {
      // optional: show a prompt to reload
    },
    onOfflineReady() {
      // optional: show a prompt that app is ready offline
      console.log("App ready to work offline");
    },
  });
}

const app = createApp(App);
app.use(router);
app.mount("#app");
