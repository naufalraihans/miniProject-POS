import { createRouter, createWebHistory } from "vue-router";
import KasirView from "../views/KasirView.vue";
import MenuView from "../views/MenuView.vue";
import RekapView from "../views/RekapView.vue";

const routes = [
  {
    path: "/",
    name: "Kasir",
    component: KasirView,
  },
  {
    path: "/menu",
    name: "Menu",
    component: MenuView,
  },
  {
    path: "/rekap",
    name: "Rekap",
    component: RekapView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
