<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-2xl shadow-md w-96">
      <h2 class="text-2xl font-semibold text-center mb-6">Register</h2>

      <form @submit.prevent="handleRegister">
        <input
          v-model="form.name"
          type="text"
          placeholder="Name"
          class="w-full border p-2 rounded mb-3"
          required
        />
        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="w-full border p-2 rounded mb-3"
          required
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          class="w-full border p-2 rounded mb-3"
          required
        />
        <input
          v-model="form.confPassword"
          type="password"
          placeholder="Konfirmasi Password"
          class="w-full border p-2 rounded mb-3"
          required
        />
        <select
          v-model="form.role"
          class="w-full border p-2 rounded mb-4 text-gray-700"
          required
        >
          <option disabled value="">Pilih Role</option>
          <option value="creator">Admin</option>
          <option value="inputer">Peneliti</option>
        </select>

        <button
          class="bg-green-500 text-white w-full py-2 rounded hover:bg-green-600"
        >
          Daftar
        </button>
      </form>

      <p class="text-sm text-center mt-4">
        Sudah punya akun?
        <router-link to="/login" class="text-blue-500 hover:underline">
          Login
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useAuthStore } from "../store/auth";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { showSuccess, showLoading, handleApiError } from "../utils/swal";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  name: "",
  email: "",
  password: "",
  confPassword: "",
  role: "",
});

const handleRegister = async () => {
  try {
    showLoading("Sedang memproses register...");
    await authStore.registerPeneliti(form);
    Swal.close();
    await showSuccess("Registrasi Berhasil!");
    router.push("/login");
  } catch (error) {
    handleApiError(error, "Login Gagal");
  }
};
</script>
