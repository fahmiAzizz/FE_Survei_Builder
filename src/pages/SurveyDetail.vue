<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";
import MainLayout from "../layout/MainLayout.vue";

const route = useRoute();
const router = useRouter();
const surveyId = route.params.id;

const loading = ref(false);
const survey = ref(null);
const responses = ref([]);
const showResponses = ref(false);

const fetchSurvey = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`http://localhost:2001/survei/${surveyId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    // ✅ Pastikan struktur SubQuestions masuk
    survey.value = {
      ...res.data,
      sessions: res.data.Sessions || [],
    };
  } catch (error) {
    console.error("Gagal memuat survei:", error);
  } finally {
    loading.value = false;
  }
};

const fetchResponses = async () => {
  try {
    showResponses.value = !showResponses.value;
    if (showResponses.value) {
      const res = await axios.get(
        `http://localhost:2001/survei/response/${surveyId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      responses.value = res.data.data || [];
    }
  } catch (error) {
    console.error("Gagal memuat responses:", error);
  }
};

const deleteSurvey = async () => {
  if (confirm("Yakin ingin menghapus survei ini?")) {
    try {
      await axios.delete(`http://localhost:2001/survei/${surveyId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("✅ Survei berhasil dihapus!");
      router.push("/home");
    } catch (error) {
      console.error("Gagal menghapus survei:", error);
      alert("❌ Gagal menghapus survei");
    }
  }
};

const convertToExcel = async () => {
  if (confirm("Konversi semua response survei ini ke Excel?")) {
    try {
      const res = await axios.post(
        `http://localhost:2001/survei/response/convert/${surveyId}`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `survey_${surveyId}_responses.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      alert("✅ Berhasil dikonversi ke Excel!");
    } catch (error) {
      console.error("Gagal konversi survei:", error);
      alert("❌ Gagal konversi survei ke Excel.");
    }
  }
};

const goToEditResponse = (responseId) => {
  router.push(`/survei/${surveyId}/response/${responseId}/edit`);
};

const deleteResponse = async (responseId) => {
  if (confirm("Yakin ingin menghapus response ini?")) {
    try {
      await axios.delete(
        `http://localhost:2001/survei/response/delete/${responseId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      alert("✅ Response berhasil dihapus!");
      fetchResponses(); // refresh list
    } catch (error) {
      console.error("❌ Gagal menghapus response:", error);
      alert("Gagal menghapus response.");
    }
  }
};

const goToEdit = () => router.push(`/survei/${surveyId}/edit`);
const goToInput = () => router.push(`/survei/${surveyId}/input`);
const goBack = () => router.push(`/home`);

onMounted(fetchSurvey);
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="text-gray-500">Memuat survei...</div>

    <div v-else-if="survey" class="p-6 bg-white rounded-xl shadow-md">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold text-indigo-700">{{ survey.name }}</h1>

        <div class="space-x-3 space-y-3">
          <button
            @click="goToInput"
            class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            🧾 Input Responden
          </button>
          <button
            @click="fetchResponses"
            class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
          >
            📊 {{ showResponses ? "Tutup Response" : "Lihat Response" }}
          </button>
          <button
            @click="convertToExcel"
            class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
          >
            📥 Convert Excel
          </button>
          <button
            @click="goToEdit"
            class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
          >
            ✏️ Edit
          </button>
          <button
            @click="deleteSurvey"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            🗑️ Hapus
          </button>
        </div>
      </div>

      <p class="text-gray-700 mb-4">{{ survey.description }}</p>

      <!-- SESSION DAN PERTANYAAN -->
      <div
        v-for="(session, sIndex) in survey.sessions"
        :key="session.id"
        class="mt-6"
      >
        <h2 class="text-lg font-bold text-indigo-700 mb-2">
          🗂️ {{ sIndex + 1 }}. {{ session.name }}
        </h2>
        <div
          v-for="(q, qIndex) in session.Questions.filter(
            (q) => q.parent_id === null
          )"
          :key="q.id"
          class="ml-4 mb-3 border-l-4 border-indigo-300 pl-3"
        >
          <p class="font-semibold text-gray-800">
            {{ sIndex + 1 }}.{{ qIndex + 1 }} {{ q.question_text }}
            <span class="text-sm text-gray-500">({{ q.type }})</span>
          </p>

          <!-- Opsi utama -->
          <ul
            v-if="q.QuestionOptions?.length"
            class="ml-6 text-sm text-gray-600 list-disc"
          >
            <li v-for="(opt, oIndex) in q.QuestionOptions" :key="oIndex">
              {{ opt.option_text }}
            </li>
          </ul>

          <!-- 🔸 Sub Questions -->
          <div
            v-for="(sub, subIndex) in session.Questions.filter(
              (sub) => sub.parent_id === q.id
            )"
            :key="sub.id"
            class="ml-6 mt-2 border-l-2 border-gray-200 pl-3"
          >
            <p class="text-gray-700">
              ↳ {{ qIndex + 1 }}.{{ subIndex + 1 }} {{ sub.question_text }}
              <span class="text-sm text-gray-500">({{ sub.type }})</span>
            </p>

            <ul
              v-if="sub.QuestionOptions?.length"
              class="ml-6 text-xs text-gray-600 list-square"
            >
              <li v-for="(opt, oIndex) in sub.QuestionOptions" :key="oIndex">
                {{ opt.option_text }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="flex justify-end mt-8">
        <button
          @click="goBack"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-md"
        >
          ⬅️ Kembali
        </button>
      </div>

      <!-- RESPONSE LIST -->
      <div v-if="showResponses" class="mt-10">
        <h2 class="text-xl font-bold mb-4 text-indigo-700">
          📊 Daftar Response Survei
        </h2>

        <div v-if="responses.length === 0" class="text-gray-500">
          Belum ada response yang masuk.
        </div>

        <div
          v-for="(resp, rIndex) in responses"
          :key="resp.id"
          class="border rounded-lg p-4 mb-6 shadow-md bg-gray-50"
        >
          <div class="flex justify-between items-center mb-2">
            <h3 class="font-semibold text-lg text-gray-800">
              🧍‍♂️ {{ resp.responden.name }} ({{ resp.responden.email }})
            </h3>
            <span class="text-sm text-gray-500">
              🕒 {{ new Date(resp.submitted_at).toLocaleString("id-ID") }}
            </span>
          </div>

          <p class="text-sm text-gray-600 mb-2">
            📍 {{ resp.responden.address }}
          </p>

          <p class="text-sm text-gray-700 mb-3">
            🧑‍🔬 Dikirim oleh: <strong>{{ resp.submitted_by_name }}</strong>
          </p>
          <div class="flex gap-2 mb-3">
            <button
              @click="goToEditResponse(resp.id)"
              class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
            >
              ✏️ Edit Response
            </button>
            <button
              @click="deleteResponse(resp.id)"
              class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              🗑️ Hapus Response
            </button>
          </div>

          <table class="w-full border text-sm">
            <thead class="bg-gray-200 text-gray-700">
              <tr>
                <th class="border px-3 py-2 text-left w-1/4">Session</th>
                <th class="border px-3 py-2 text-left w-1/3">Pertanyaan</th>
                <th class="border px-3 py-2 text-left">Jawaban</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(ans, aIndex) in resp.answers"
                :key="aIndex"
                class="hover:bg-white"
              >
                <td class="border px-3 py-1">{{ ans.session_name || "-" }}</td>
                <td class="border px-3 py-1">
                  {{ ans.question_text }}
                  <template v-if="ans.parent_question_text">
                    <br />
                    <span class="text-xs text-gray-500">
                      ↳ Sub: {{ ans.parent_question_text }}
                    </span>
                  </template>
                </td>
                <td class="border px-3 py-1">{{ ans.answer_text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="text-gray-500">Survei tidak ditemukan.</div>
  </MainLayout>
</template>

<style scoped>
table {
  border-collapse: collapse;
}
</style>
