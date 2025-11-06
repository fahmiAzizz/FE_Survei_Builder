<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-2xl shadow-md w-96">
      <h2 class="text-2xl font-semibold text-center mb-6">Login</h2>

      <form @submit.prevent="handleLogin">
        <input
          v-model="email"
          type="text"
          placeholder="email"
          class="w-full border p-2 rounded mb-3"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full border p-2 rounded mb-4"
        />
        <button
          class="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </form>

      <p class="text-sm text-center mt-4">
        Belum punya akun?
        <router-link to="/register" class="text-blue-500 hover:underline"
          >Daftar</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { showLoading, showSuccess, handleApiError } from "../utils/swal.js";

const email = ref("");
const password = ref("");
const router = useRouter();
const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    showLoading("Sedang memproses login...");

    await authStore.loginPeneliti(email.value, password.value);
    Swal.close();
    await showSuccess("Berhasil Login!", "Selamat datang kembali 👋");

    router.push("/Home");
  } catch (error) {
    handleApiError(error, "Login Gagal");
  }
};
</script>
