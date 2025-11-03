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
        />
        <input
          v-model="form.email"
          type="email"
          placeholder="Email"
          class="w-full border p-2 rounded mb-3"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Password"
          class="w-full border p-2 rounded mb-3"
        />
        <input
          v-model="form.confPassword"
          type="password"
          placeholder="Konfirmasi Password"
          class="w-full border p-2 rounded mb-3"
        />
        <select
          v-model="form.role"
          class="w-full border p-2 rounded mb-4 text-gray-700"
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
    await authStore.registerPeneliti(form);
    alert("Registrasi berhasil! Silakan login.");
    router.push("/login");
  } catch (error) {
    console.error("Register error:", error);
    alert("Registrasi gagal! Periksa kembali data Anda.");
  }
};
</script>
