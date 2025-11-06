<template>
  <nav
    class="bg-linear-to-br from-blue-600 to-blue-400 text-white p-4 flex items-center justify-between"
  >
    <h1 class="text-2xl font-semibold">Web Survey Builder</h1>
    <button
      @click="logout"
      class="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100 transition"
    >
      Log Out
    </button>
  </nav>
</template>

<script setup>
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { showConfirm, showSuccess, showLoading } from "../utils/swal.js";

const router = useRouter();

const logout = async () => {
  try {
    // Konfirmasi dulu
    const confirm = await showConfirm(
      "Yakin ingin logout?",
      "Sesi kamu akan berakhir dan perlu login kembali.",
      "Ya, Logout",
      "Batal"
    );

    if (!confirm) return;

    // Tampilkan loading sementara
    showLoading("Sedang logout...");

    // Hapus semua data login dari localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    localStorage.removeItem("role");

    // Tutup loading, tampilkan sukses
    Swal.close();
    await showSuccess("Berhasil Logout", "Kamu telah keluar dari sistem.");

    // Redirect ke halaman login tanpa reload
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
    Swal.fire({
      icon: "error",
      title: "Gagal Logout",
      text: "Terjadi kesalahan saat logout.",
    });
  }
};
</script>
