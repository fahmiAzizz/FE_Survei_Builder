import { defineStore } from "pinia";
import { login, register, logout } from "../api/auth";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    peneliti: null,
    token: localStorage.getItem("token") || null,
  }),

  actions: {
    async loginPeneliti(email, password) {
      try {
        const data = await login(email, password);
        this.token = data.data.accessToken;
        localStorage.setItem("token", data.data.accessToken);

        return data;
      } catch (error) {
        console.error("Login error:", error.response?.data || error.message);
        throw error;
      }
    },

    async registerPeneliti(formData) {
      await register(formData);
    },

    async logoutPeneliti() {
      await logout();
      this.peneliti = null;
      this.token = null;
      localStorage.removeItem("token");
    },

    loadToken() {
      const token = localStorage.getItem("token");
      if (token) this.token = token;
    },
  },
});
