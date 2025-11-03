<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import MainLayout from "../layout/MainLayout.vue";
import CreateSurveyForm from "./CreateSurveyForm.vue";
import { useRouter } from "vue-router";

const router = useRouter();
const showForm = ref(false);
const loading = ref(false);
const surveiList = ref([]);

// Ambil daftar survei
const fetchSurvei = async () => {
  try {
    loading.value = true;
    const res = await axios.get("http://localhost:2001/survei", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    surveiList.value = res.data;
  } catch (error) {
    console.error("Gagal mengambil survei:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchSurvei);

const handleSurveyCreated = async () => {
  showForm.value = false;
  await fetchSurvei();
};

// Navigasi ke detail survei
const goToDetail = (id) => {
  router.push(`/survei/${id}`);
};
</script>

<template>
  <MainLayout>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Dashboard Survei Builder</h1>
      <button
        @click="showForm = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
      >
        + Buat Survei Baru
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">Memuat survei...</div>

    <div
      v-else-if="surveiList.length"
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div
        v-for="survey in surveiList"
        :key="survey.id"
        class="p-4 bg-white shadow rounded-lg hover:bg-gray-50 cursor-pointer transition"
        @click="goToDetail(survey.id)"
      >
        <h2 class="text-lg font-semibold">{{ survey.name }}</h2>
        <p class="text-gray-600 text-sm mb-2">{{ survey.description }}</p>
        <p class="text-gray-500 text-xs">
          Dibuat oleh: {{ survey.Peneliti.name }} |
          {{ new Date(survey.createdAt).toLocaleDateString() }}
        </p>
      </div>
    </div>

    <div v-else class="text-gray-500 mt-4">Belum ada survei.</div>

    <CreateSurveyForm
      v-if="showForm"
      @close="showForm = false"
      @created="handleSurveyCreated"
    />
  </MainLayout>
</template>
