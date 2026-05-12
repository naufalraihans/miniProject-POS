import { Capacitor } from "@capacitor/core";

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

export function getRuntimePlatform() {
  return isAndroidApp() ? "android" : "web";
}

export function shouldRegisterServiceWorker() {
  return !isNativePlatform();
}
