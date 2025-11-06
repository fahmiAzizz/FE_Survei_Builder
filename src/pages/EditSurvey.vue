<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MainLayout from "../layout/MainLayout.vue";
import Swal from "sweetalert2";
import { showSuccess, showLoading, handleApiError } from "../utils/swal.js"; // pastikan path sesuai

const apiUrl = import.meta.env.VITE_API_URL;
const route = useRoute();
const router = useRouter();
const surveyId = route.params.id;

const loading = ref(false);
const survey = ref({
  id: null,
  name: "",
  description: "",
  sessions: [],
});

// 🧭 Fetch data survei
const fetchSurvey = async () => {
  try {
    loading.value = true;
    showLoading("Memuat survei...");

    const res = await axios.get(`${apiUrl}survei/${surveyId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    survey.value = {
      id: res.data.id,
      name: res.data.name,
      description: res.data.description,
      sessions: (res.data.Sessions || []).map((s) => {
        const allQuestions = (s.Questions || []).map((q) => ({
          id: q.id,
          session_id: q.session_id,
          parent_id: q.parent_id,
          question_text: q.question_text,
          type: q.type,
          required: q.required,
          order: q.order,
          QuestionOptions: q.QuestionOptions || [],
          subQuestions: [],
        }));

        const questionMap = new Map();
        allQuestions.forEach((q) => questionMap.set(q.id, q));

        const rootQuestions = [];
        allQuestions.forEach((q) => {
          if (q.parent_id && questionMap.has(q.parent_id)) {
            questionMap.get(q.parent_id).subQuestions.push(q);
          } else {
            rootQuestions.push(q);
          }
        });

        return {
          id: s.id,
          name: s.name,
          order: s.order,
          allow_multiple: s.allow_multiple ?? false,
          questions: rootQuestions.sort((a, b) => a.order - b.order),
        };
      }),
    };

    Swal.close();
  } catch (err) {
    handleApiError(err, "Gagal memuat survei");
  } finally {
    loading.value = false;
  }
};

// ✏️ CRUD Session & Question
const addSession = () => {
  survey.value.sessions.push({
    id: null,
    survei_id: survey.value.id,
    name: "",
    order: survey.value.sessions.length + 1,
    allow_multiple: false,
    questions: [],
  });
};

const removeSession = (sIndex) => {
  if (
    confirm(
      "Yakin ingin menghapus sesi ini beserta semua pertanyaan di dalamnya?"
    )
  ) {
    survey.value.sessions.splice(sIndex, 1);
  }
};

const addQuestion = (session) => {
  session.questions.push({
    id: null,
    session_id: session.id,
    parent_id: null,
    question_text: "",
    type: "text",
    required: false,
    order: session.questions.length + 1,
    QuestionOptions: [],
    subQuestions: [],
  });
};

const addSubQuestion = (question) => {
  question.subQuestions.push({
    id: null,
    parent_id: question.id,
    question_text: "",
    type: "text",
    required: false,
    order: question.subQuestions.length + 1,
    QuestionOptions: [],
  });
};

const addOption = (question) => {
  question.QuestionOptions.push({
    id: null,
    question_id: question.id || null,
    option_text: "",
  });
};

const removeOption = (question, index) => {
  question.QuestionOptions.splice(index, 1);
};

const removeQuestion = (session, qIndex) => {
  if (
    confirm("Yakin ingin menghapus pertanyaan ini beserta sub-pertanyaannya?")
  ) {
    session.questions.splice(qIndex, 1);
  }
};

const removeSubQuestion = (question, subIndex) => {
  if (confirm("Hapus sub-pertanyaan ini?")) {
    question.subQuestions.splice(subIndex, 1);
  }
};

const duplicateQuestion = (session, question) => {
  const clone = JSON.parse(JSON.stringify(question));
  clone.id = null;
  clone.question_text += " (Salinan)";
  clone.subQuestions = clone.subQuestions.map((sub) => ({
    ...sub,
    id: null,
    parent_id: null,
    question_text: sub.question_text + " (Salinan)",
  }));
  session.questions.push(clone);
};

// 💾 Simpan survei
const saveSurvey = async () => {
  try {
    showLoading("Menyimpan survei...");

    const payload = {
      name: survey.value.name,
      description: survey.value.description,
      sessions: survey.value.sessions.map((s, sIdx) => ({
        id: s.id,
        name: s.name,
        order: sIdx + 1,
        allow_multiple: s.allow_multiple,
        questions: s.questions.map((q, qIdx) => ({
          id: q.id,
          question_text: q.question_text,
          type: q.type,
          required: q.required,
          order: qIdx + 1,
          parent_id: null,
          options: q.QuestionOptions.map((opt) => opt.option_text),
          SubQuestions: q.subQuestions.map((sub, subIdx) => ({
            id: sub.id,
            question_text: sub.question_text,
            type: sub.type,
            required: sub.required,
            order: subIdx + 1,
            parent_id: q.id,
            options: sub.QuestionOptions.map((opt) => opt.option_text),
          })),
        })),
      })),
    };

    await axios.put(`${apiUrl}survei/${surveyId}`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    Swal.close();
    showSuccess("Berhasil!", "Survei berhasil diperbarui!");
    router.push(`/survei/${surveyId}`);
  } catch (err) {
    handleApiError(err, "Gagal menyimpan survei");
  }
};

const back = () => {
  router.push(`/survei/${surveyId}`);
};

onMounted(fetchSurvey);
</script>

<template>
  <MainLayout>
    <div class="md:p-8 bg-gray-50 min-h-screen">
      <div class="max-w-5xl mx-auto bg-white p-4 md:p-8 rounded-2xl shadow-lg">
        <h1
          class="text-2xl md:text-3xl font-bold mb-6 text-gray-800 text-center md:text-left"
        >
          📝 Edit Survei
        </h1>

        <div v-if="loading" class="text-gray-500 text-center py-6">
          Memuat survei...
        </div>

        <div v-else>
          <!-- Nama & Deskripsi -->
          <div class="space-y-4 mb-6">
            <div>
              <label class="block font-semibold mb-1 text-gray-700"
                >Nama Survei</label
              >
              <input
                v-model="survey.name"
                class="w-full border rounded-lg p-2.5 focus:ring focus:ring-blue-200"
              />
            </div>

            <div>
              <label class="block font-semibold mb-1 text-gray-700"
                >Deskripsi</label
              >
              <textarea
                v-model="survey.description"
                class="w-full border rounded-lg p-2.5 focus:ring focus:ring-blue-200"
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Sessions -->
          <div
            v-for="(session, sIndex) in survey.sessions"
            :key="sIndex"
            class="border rounded-xl p-4 md:p-5 mb-6 bg-gray-50 shadow-sm"
          >
            <div
              class="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3"
            >
              <h2
                class="text-lg font-semibold text-gray-800 text-center md:text-left"
              >
                📂 Session {{ sIndex + 1 }}
              </h2>

              <div class="flex flex-wrap justify-center md:justify-end gap-2">
                <button
                  @click="addQuestion(session)"
                  class="bg-blue-500 text-white px-3 py-1.5 rounded text-sm shadow"
                >
                  + Pertanyaan
                </button>
                <button
                  @click="removeSession(sIndex)"
                  class="bg-red-500 text-white px-3 py-1.5 rounded text-sm shadow"
                >
                  🗑 Hapus
                </button>
              </div>
            </div>

            <input
              v-model="session.name"
              placeholder="Nama sesi"
              class="w-full border rounded-lg p-2.5 mb-3 focus:ring focus:ring-blue-200"
            />

            <label class="flex flex-wrap items-center gap-2 mb-4 text-gray-700">
              <input
                type="checkbox"
                v-model="session.allow_multiple"
                class="w-4 h-4 accent-blue-500"
              />
              <span>Izinkan beberapa entri (multiple responses)</span>
            </label>

            <!-- Pertanyaan -->
            <div
              v-for="(question, qIndex) in session.questions"
              :key="qIndex"
              class="border rounded-lg bg-white py-8 px-4 mb-4 shadow-sm relative"
            >
              <div
                class="flex flex-col sm:flex-row sm:justify-between sm:items-center pb-3 gap-2"
              >
                <p class="font-semibold text-center sm:text-left">
                  Pertanyaan {{ qIndex + 1 }}
                </p>

                <div class="flex flex-wrap justify-center sm:justify-end gap-2">
                  <button
                    @click="duplicateQuestion(session, question)"
                    title="Duplikat"
                    class="bg-gray-500 text-white px-3 py-1.5 rounded text-sm shadow"
                  >
                    📄 Duplikasi
                  </button>
                  <button
                    @click="removeQuestion(session, qIndex)"
                    title="Hapus"
                    class="bg-red-500 text-white px-2 py-1.5 rounded text-sm shadow"
                  >
                    🗑 Hapus
                  </button>
                </div>
              </div>

              <input
                v-model="question.question_text"
                placeholder="Teks pertanyaan"
                class="w-full border rounded-lg p-2.5 mb-3 focus:ring focus:ring-blue-200"
              />

              <select
                v-model="question.type"
                class="w-full border rounded-lg p-2.5 mb-3 focus:ring focus:ring-blue-200"
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="rating">Rating</option>
              </select>

              <!-- Opsi -->
              <div
                v-if="
                  question.type === 'dropdown' || question.type === 'checkbox'
                "
                class="bg-gray-50 border rounded-lg p-3 mb-3"
              >
                <label class="block font-medium mb-2 text-gray-700"
                  >Opsi Jawaban:</label
                >
                <div
                  v-for="(opt, oIndex) in question.QuestionOptions"
                  :key="oIndex"
                  class="flex gap-2 mb-2 flex-wrap"
                >
                  <input
                    v-model="opt.option_text"
                    placeholder="Isi opsi"
                    class="flex-1 border rounded-lg p-2 focus:ring focus:ring-blue-200"
                  />
                  <button
                    @click="removeOption(question, oIndex)"
                    class="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
                <button
                  @click="addOption(question)"
                  class="text-blue-600 text-sm font-medium"
                >
                  + Tambah Opsi
                </button>
              </div>

              <!-- Sub pertanyaan -->
              <div class="mt-3 border-l-4 border-blue-200 pl-4">
                <div
                  v-for="(sub, subIndex) in question.subQuestions"
                  :key="subIndex"
                  class="border rounded-lg bg-gray-50 p-3 mb-3 relative"
                >
                  <button
                    @click="removeSubQuestion(question, subIndex)"
                    class="absolute top-1 right-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>

                  <input
                    v-model="sub.question_text"
                    placeholder="Teks sub-pertanyaan"
                    class="w-full border rounded-lg p-2 mb-2 focus:ring focus:ring-blue-200"
                  />
                  <select
                    v-model="sub.type"
                    class="w-full border rounded-lg p-2 mb-3 focus:ring focus:ring-blue-200"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                  </select>

                  <div
                    v-if="sub.type === 'dropdown' || sub.type === 'checkbox'"
                    class="border bg-white rounded-lg p-3"
                  >
                    <label class="block font-medium mb-2 text-gray-700"
                      >Opsi:</label
                    >
                    <div
                      v-for="(opt, soIndex) in sub.QuestionOptions"
                      :key="soIndex"
                      class="flex gap-2 mb-2 flex-wrap"
                    >
                      <input
                        v-model="opt.option_text"
                        placeholder="Isi opsi"
                        class="flex-1 border rounded-lg p-2 focus:ring focus:ring-blue-200"
                      />
                      <button
                        @click="sub.QuestionOptions.splice(soIndex, 1)"
                        class="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      @click="addOption(sub)"
                      class="text-blue-600 text-sm font-medium"
                    >
                      + Tambah Opsi
                    </button>
                  </div>
                </div>

                <button
                  @click="addSubQuestion(question)"
                  class="text-blue-600 text-sm font-medium"
                >
                  + Tambah Sub Pertanyaan
                </button>
              </div>
            </div>
          </div>

          <button
            @click="addSession"
            class="bg-purple-600 text-white px-4 py-2 rounded-lg shadow mb-6 w-full md:w-auto"
          >
            + Tambah Session
          </button>
          <div class="flex md:justify-end gap-3">
            <div class="flex justify-center md:justify-end">
              <button
                @click="saveSurvey"
                class="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md w-full md:w-auto"
              >
                💾 Simpan Perubahan
              </button>
            </div>
            <div class="flex justify-center md:justify-end">
              <button
                @click="back"
                class="bg-red-600 text-white px-6 py-2 rounded-lg shadow-md w-full md:w-auto"
              >
                ❌ Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>
