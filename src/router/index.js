import { createRouter, createWebHistory } from "vue-router";
import Home from "../pages/Home.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import SurveyDetail from "../pages/SurveyDetail.vue";
import EditSurvey from "../pages/EditSurvey.vue";
import InputResponden from "../pages/InputResponse.vue"; // ⬅️ tambahkan ini
import { useAuthStore } from "../store/auth";
import EditResponse from "../pages/EditResponse.vue";

const routes = [
  { path: "/", redirect: "/home" },
  { path: "/home", component: Home, meta: { requiresAuth: true } },
  { path: "/login", component: Login },
  { path: "/register", component: Register },

  {
    path: "/survei/:id",
    name: "SurveyDetail",
    component: SurveyDetail,
    meta: { requiresAuth: true },
  },
  {
    path: "/survei/:id/edit",
    name: "EditSurvey",
    component: EditSurvey,
    meta: { requiresAuth: true },
  },
  {
    path: "/survei/:id/input",
    name: "InputResponse",
    component: InputResponden,
    meta: { requiresAuth: true },
  },
  {
    path: "/survei/:id/response/:responseId/edit",
    name: "EditResponse",
    component: EditResponse,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔒 Proteksi halaman yang butuh login
router.beforeEach((to) => {
  const auth = useAuthStore();
  const token = auth.token || localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    alert("Silakan login terlebih dahulu");
    return "/login";
  }
});

export default router;
