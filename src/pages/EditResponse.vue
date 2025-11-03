<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MainLayout from "../layout/MainLayout.vue";

const route = useRoute();
const router = useRouter();
const surveiId = route.params.id;
const responseId = route.params.responseId;

const loading = ref(false);
const survey = ref(null);
const responden = ref({ name: "", email: "", address: "" });
const answers = ref([]);

const fetchData = async () => {
  try {
    loading.value = true;

    const [surveyRes, responseRes] = await Promise.all([
      axios.get(
        `https://be-survei-builder-dlkz.vercel.app/survei/${surveiId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      ),
      axios.get(
        `https://be-survei-builder-dlkz.vercel.app/survei/responseById/${responseId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      ),
    ]);

    const formattedSurvey = {
      id: surveyRes.data.id,
      name: surveyRes.data.name,
      description: surveyRes.data.description,
      sessions: (surveyRes.data.Sessions || []).map((s) => {
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

        const map = new Map();
        allQuestions.forEach((q) => map.set(q.id, q));
        const root = [];

        allQuestions.forEach((q) => {
          if (q.parent_id && map.has(q.parent_id)) {
            map.get(q.parent_id).subQuestions.push(q);
          } else {
            root.push(q);
          }
        });

        return { id: s.id, name: s.name, order: s.order, questions: root };
      }),
    };

    survey.value = formattedSurvey;

    const responseData = responseRes.data.data;
    responden.value = { ...responseData.responden };

    const flatten = (qs) =>
      qs.flatMap((q) => [
        q,
        ...(q.subQuestions?.length ? flatten(q.subQuestions) : []),
      ]);
    const allQuestionsFlat = formattedSurvey.sessions.flatMap((s) =>
      flatten(s.questions)
    );

    answers.value = allQuestionsFlat.map((q) => {
      const existing = responseData.answers.find((a) => a.question_id === q.id);
      return {
        question_id: q.id,
        answer_text:
          q.type === "checkbox"
            ? existing?.answer_text?.split(", ").filter(Boolean) || []
            : existing?.answer_text || "",
      };
    });
  } catch (err) {
    console.error("❌ Gagal memuat data:", err);
  } finally {
    loading.value = false;
  }
};

const updateResponse = async () => {
  try {
    const payload = {
      responden: responden.value,
      answers: answers.value.map((a) => ({
        question_id: a.question_id,
        answer_text: Array.isArray(a.answer_text)
          ? a.answer_text.join(", ")
          : a.answer_text,
      })),
    };

    await axios.put(
      `https://be-survei-builder-dlkz.vercel.app/survei/response/edit/${responseId}`,
      payload,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    alert("✅ Response berhasil diperbarui!");
    router.push(`/survei/${surveiId}`);
  } catch (error) {
    console.error("❌ Gagal update response:", error);
    alert("Terjadi kesalahan saat memperbarui response");
  }
};

onMounted(fetchData);
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="text-gray-500">Memuat data...</div>

    <div v-else-if="survey" class="p-6 bg-white rounded-xl shadow-md">
      <h1 class="text-2xl font-bold mb-4">
        ✏️ Edit Response - {{ responden.name }}
      </h1>
      <p class="text-gray-600 mb-6">{{ survey.description }}</p>

      <!-- Data Responden -->
      <div class="mb-6">
        <h2 class="text-xl font-semibold mb-2">Data Responden</h2>
        <input
          v-model="responden.name"
          placeholder="Nama lengkap"
          class="w-full border rounded p-2 mb-2"
        />
        <input
          v-model="responden.email"
          placeholder="Email"
          class="w-full border rounded p-2 mb-2"
        />
        <textarea
          v-model="responden.address"
          placeholder="Alamat"
          class="w-full border rounded p-2"
        ></textarea>
      </div>

      <!-- Pertanyaan -->
      <div
        v-for="(session, sIndex) in survey.sessions"
        :key="session.id"
        class="mb-6"
      >
        <h3 class="text-lg font-semibold mb-3">
          {{ sIndex + 1 }}. {{ session.name }}
        </h3>

        <div
          v-for="(q, qIndex) in session.questions"
          :key="q.id"
          class="mb-4 pl-2 border-l-4 border-blue-200"
        >
          <label class="block font-medium mb-1">{{ q.question_text }}</label>

          <!-- Input utama -->
          <textarea
            v-if="q.type === 'text'"
            v-model="answers.find((a) => a.question_id === q.id).answer_text"
            class="w-full border rounded p-2"
          ></textarea>

          <input
            v-else-if="q.type === 'number'"
            type="number"
            v-model="answers.find((a) => a.question_id === q.id).answer_text"
            class="w-full border rounded p-2"
          />

          <input
            v-else-if="q.type === 'date'"
            type="date"
            v-model="answers.find((a) => a.question_id === q.id).answer_text"
            class="border rounded p-2"
          />

          <select
            v-else-if="q.type === 'dropdown'"
            v-model="answers.find((a) => a.question_id === q.id).answer_text"
            class="w-full border rounded p-2"
          >
            <option disabled value="">Pilih salah satu</option>
            <option
              v-for="opt in q.QuestionOptions"
              :key="opt.id"
              :value="opt.option_text"
            >
              {{ opt.option_text }}
            </option>
          </select>

          <div v-else-if="q.type === 'checkbox'" class="space-y-1">
            <div
              v-for="opt in q.QuestionOptions"
              :key="opt.id"
              class="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                :value="opt.option_text"
                v-model="
                  answers.find((a) => a.question_id === q.id).answer_text
                "
              />
              <span>{{ opt.option_text }}</span>
            </div>
          </div>

          <div v-else-if="q.type === 'rating'" class="flex space-x-2">
            <label v-for="star in 5" :key="star" class="cursor-pointer text-xl">
              <input
                type="radio"
                class="hidden"
                :value="star"
                v-model="
                  answers.find((a) => a.question_id === q.id).answer_text
                "
              />
              <span
                :class="{
                  'text-yellow-500':
                    star <=
                    answers.find((a) => a.question_id === q.id).answer_text,
                  'text-gray-300':
                    star >
                    answers.find((a) => a.question_id === q.id).answer_text,
                }"
              >
                ★
              </span>
            </label>
          </div>

          <!-- Sub-question -->
          <div
            v-if="q.subQuestions.length"
            class="pl-6 mt-2 border-l-2 border-gray-200"
          >
            <div v-for="sub in q.subQuestions" :key="sub.id" class="mb-3">
              <label class="block font-medium text-sm mb-1 text-gray-700">
                ↳ {{ sub.question_text }}
              </label>

              <!-- Sama seperti parent -->
              <textarea
                v-if="sub.type === 'text'"
                v-model="
                  answers.find((a) => a.question_id === sub.id).answer_text
                "
                class="w-full border rounded p-2"
              ></textarea>

              <input
                v-else-if="sub.type === 'number'"
                type="number"
                v-model="
                  answers.find((a) => a.question_id === sub.id).answer_text
                "
                class="w-full border rounded p-2"
              />

              <input
                v-else-if="sub.type === 'date'"
                type="date"
                v-model="
                  answers.find((a) => a.question_id === sub.id).answer_text
                "
                class="border rounded p-2"
              />

              <select
                v-else-if="sub.type === 'dropdown'"
                v-model="
                  answers.find((a) => a.question_id === sub.id).answer_text
                "
                class="w-full border rounded p-2"
              >
                <option disabled value="">Pilih salah satu</option>
                <option
                  v-for="opt in sub.QuestionOptions"
                  :key="opt.id"
                  :value="opt.option_text"
                >
                  {{ opt.option_text }}
                </option>
              </select>

              <div v-else-if="sub.type === 'checkbox'" class="space-y-1">
                <div
                  v-for="opt in sub.QuestionOptions"
                  :key="opt.id"
                  class="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    :value="opt.option_text"
                    v-model="
                      answers.find((a) => a.question_id === sub.id).answer_text
                    "
                  />
                  <span>{{ opt.option_text }}</span>
                </div>
              </div>

              <div v-else-if="sub.type === 'rating'" class="flex space-x-2">
                <label
                  v-for="star in 5"
                  :key="star"
                  class="cursor-pointer text-xl"
                >
                  <input
                    type="radio"
                    class="hidden"
                    :value="star"
                    v-model="
                      answers.find((a) => a.question_id === sub.id).answer_text
                    "
                  />
                  <span
                    :class="{
                      'text-yellow-500':
                        star <=
                        answers.find((a) => a.question_id === sub.id)
                          .answer_text,
                      'text-gray-300':
                        star >
                        answers.find((a) => a.question_id === sub.id)
                          .answer_text,
                    }"
                  >
                    ★
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button
          @click="updateResponse"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          💾 Simpan Perubahan
        </button>
      </div>
    </div>

    <div v-else class="text-gray-500">Data tidak ditemukan.</div>
  </MainLayout>
</template>
