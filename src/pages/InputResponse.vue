<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import MainLayout from "../layout/MainLayout.vue";

const route = useRoute();
const router = useRouter();
const surveiId = route.params.id;

const loading = ref(false);
const survey = ref(null);

const responden = ref({
  name: "",
  email: "",
  address: "",
});

const answers = ref([]); // untuk semua sesi

const fetchSurvey = async () => {
  try {
    loading.value = true;
    const res = await axios.get(
      `https://be-survei-builder-dlkz.vercel.app/survei/${surveiId}`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    const formattedSurvey = {
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

        const map = new Map();
        allQuestions.forEach((q) => map.set(q.id, q));
        const rootQuestions = [];

        allQuestions.forEach((q) => {
          if (q.parent_id && map.has(q.parent_id)) {
            map.get(q.parent_id).subQuestions.push(q);
          } else {
            rootQuestions.push(q);
          }
        });

        return {
          id: s.id,
          name: s.name,
          order: s.order,
          allow_multiple: s.allow_multiple || false, // 🆕 ambil field baru
          questions: rootQuestions.sort((a, b) => a.order - b.order),
        };
      }),
    };

    survey.value = formattedSurvey;

    // Siapkan jawaban untuk setiap session
    const flatten = (qs) =>
      qs.flatMap((q) => [
        q,
        ...(q.subQuestions?.length ? flatten(q.subQuestions) : []),
      ]);

    answers.value = formattedSurvey.sessions.map((session) => {
      const allQuestionsFlat = flatten(session.questions);
      return {
        session_id: session.id,
        allow_multiple: session.allow_multiple,
        sets: [
          allQuestionsFlat.map((q) => ({
            question_id: q.id,
            answer_text: q.type === "checkbox" ? [] : "",
          })),
        ],
      };
    });
  } catch (err) {
    console.error("Gagal memuat survei:", err);
  } finally {
    loading.value = false;
  }
};

// 🆕 Tambahkan set jawaban baru di session
const addAnswerSet = (sessionId) => {
  const sessionAnswer = answers.value.find((s) => s.session_id === sessionId);
  if (!sessionAnswer) return;

  const surveySession = survey.value.sessions.find((s) => s.id === sessionId);
  const flatten = (qs) =>
    qs.flatMap((q) => [
      q,
      ...(q.subQuestions?.length ? flatten(q.subQuestions) : []),
    ]);
  const allQuestionsFlat = flatten(surveySession.questions);

  const newSet = allQuestionsFlat.map((q) => ({
    question_id: q.id,
    answer_text: q.type === "checkbox" ? [] : "",
  }));

  sessionAnswer.sets.push(newSet);
};

// 🆕 Hapus set jawaban tertentu
const removeAnswerSet = (sessionId, index) => {
  const sessionAnswer = answers.value.find((s) => s.session_id === sessionId);
  if (!sessionAnswer) return;
  if (sessionAnswer.sets.length > 1) sessionAnswer.sets.splice(index, 1);
};

const submitResponse = async () => {
  try {
    if (!responden.value.name || !responden.value.email) {
      alert("Nama dan email wajib diisi!");
      return;
    }

    // Validasi pertanyaan kosong
    for (const s of answers.value) {
      for (const set of s.sets) {
        const kosong = set.find((a) =>
          Array.isArray(a.answer_text)
            ? a.answer_text.length === 0
            : !a.answer_text
        );
        if (kosong) {
          alert("Masih ada pertanyaan yang belum dijawab!");
          return;
        }
      }
    }

    const allAnswers = answers.value.flatMap((s) =>
      s.sets.flatMap((set, setIndex) =>
        set.map((a) => ({
          session_id: s.session_id, // 🆕 tambahkan agar tahu asal session
          question_id: a.question_id,
          answer_text: Array.isArray(a.answer_text)
            ? a.answer_text.join(", ")
            : a.answer_text,
          group_index: s.allow_multiple ? setIndex + 1 : 1, // 🧠 kalau session tidak multiple, tetap 1
        }))
      )
    );

    const payload = {
      survei_id: surveiId,
      responden: responden.value,
      submitted_by: Number(localStorage.getItem("id")) || 1,
      answers: allAnswers,
    };

    await axios.post(
      "https://be-survei-builder-dlkz.vercel.app/survei/input",
      payload,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      }
    );

    alert("Respon survei berhasil dikirim!");
    router.push(`/survei/${surveiId}`);
  } catch (err) {
    console.error("Gagal mengirim respon:", err);
    alert("Terjadi kesalahan saat mengirim respon");
  }
};

onMounted(fetchSurvey);
</script>

<template>
  <MainLayout>
    <div v-if="loading" class="text-gray-500">Memuat survei...</div>

    <div v-else-if="survey" class="p-6 bg-white rounded-xl shadow-md">
      <h1 class="text-2xl font-bold mb-4">{{ survey.name }}</h1>
      <p class="text-gray-700 mb-6">{{ survey.description }}</p>

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

      <!-- Sessions -->
      <div
        v-for="(session, sIndex) in survey.sessions"
        :key="session.id"
        class="mb-8 p-4 border border-gray-200 rounded-lg"
      >
        <h3 class="text-lg font-semibold mb-3">
          {{ sIndex + 1 }}. {{ session.name }}
          <span v-if="session.allow_multiple" class="text-sm text-blue-600"
            >(Bisa lebih dari satu)</span
          >
        </h3>

        <!-- Untuk setiap set jawaban -->
        <div
          v-for="(set, setIndex) in answers.find(
            (a) => a.session_id === session.id
          ).sets"
          :key="setIndex"
          class="mb-6 border rounded-lg p-3 bg-gray-50"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="font-semibold text-gray-700"
              >Kode {{ setIndex + 1 }}</span
            >
            <button
              v-if="session.allow_multiple && setIndex > 0"
              @click="removeAnswerSet(session.id, setIndex)"
              class="text-red-500 text-sm hover:underline"
            >
              Hapus
            </button>
          </div>

          <!-- Pertanyaan -->
          <div
            v-for="(q, qIndex) in session.questions"
            :key="q.id"
            class="mb-4 pl-2 border-l-4 border-blue-200"
          >
            <label class="block font-medium mb-1">{{ q.question_text }}</label>

            <!-- Input berdasarkan type -->
            <template v-if="q.type === 'text'">
              <textarea
                v-model="set.find((a) => a.question_id === q.id).answer_text"
                class="w-full border rounded p-2"
                placeholder="Jawaban..."
              ></textarea>
            </template>

            <template v-else-if="q.type === 'number'">
              <input
                type="number"
                v-model="set.find((a) => a.question_id === q.id).answer_text"
                class="w-full border rounded p-2"
              />
            </template>

            <template v-else-if="q.type === 'date'">
              <input
                type="date"
                v-model="set.find((a) => a.question_id === q.id).answer_text"
                class="border rounded p-2"
              />
            </template>

            <template v-else-if="q.type === 'dropdown'">
              <select
                v-model="set.find((a) => a.question_id === q.id).answer_text"
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
            </template>

            <template v-else-if="q.type === 'checkbox'">
              <div class="space-y-1">
                <div
                  v-for="opt in q.QuestionOptions"
                  :key="opt.id"
                  class="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    :value="opt.option_text"
                    v-model="
                      set.find((a) => a.question_id === q.id).answer_text
                    "
                  />
                  <span>{{ opt.option_text }}</span>
                </div>
              </div>
            </template>

            <template v-else-if="q.type === 'rating'">
              <div class="flex space-x-2">
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
                      set.find((a) => a.question_id === q.id).answer_text
                    "
                  />
                  <span
                    :class="{
                      'text-yellow-500':
                        star <=
                        set.find((a) => a.question_id === q.id).answer_text,
                      'text-gray-300':
                        star >
                        set.find((a) => a.question_id === q.id).answer_text,
                    }"
                  >
                    ★
                  </span>
                </label>
              </div>
            </template>
            <div
              v-if="q.subQuestions.length"
              class="pl-6 mt-2 border-l-2 border-gray-200"
            >
              <div v-for="sub in q.subQuestions" :key="sub.id" class="mb-3">
                <label class="block font-medium mb-1 text-sm text-gray-700">
                  ↳ {{ sub.question_text }}
                </label>

                <textarea
                  v-if="sub.type === 'text'"
                  v-model="
                    set.find((a) => a.question_id === sub.id).answer_text
                  "
                  class="w-full border rounded p-2"
                ></textarea>

                <input
                  v-else-if="sub.type === 'number'"
                  type="number"
                  v-model="
                    set.find((a) => a.question_id === sub.id).answer_text
                  "
                  class="w-full border rounded p-2"
                />

                <input
                  v-else-if="sub.type === 'date'"
                  type="date"
                  v-model="
                    set.find((a) => a.question_id === sub.id).answer_text
                  "
                  class="border rounded p-2"
                />

                <select
                  v-else-if="sub.type === 'dropdown'"
                  v-model="
                    set.find((a) => a.question_id === sub.id).answer_text
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
                        set.find((a) => a.question_id === sub.id).answer_text
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
                        set.find((a) => a.question_id === sub.id).answer_text
                      "
                    />
                    <span
                      :class="{
                        'text-yellow-500':
                          star <=
                          set.find((a) => a.question_id === sub.id).answer_text,
                        'text-gray-300':
                          star >
                          set.find((a) => a.question_id === sub.id).answer_text,
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

        <!-- Tombol tambah kode -->
        <button
          v-if="session.allow_multiple"
          @click="addAnswerSet(session.id)"
          class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          + Tambah Kode Jawaban
        </button>
      </div>

      <button
        @click="submitResponse"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Kirim Jawaban
      </button>
    </div>

    <div v-else class="text-gray-500">Survei tidak ditemukan.</div>
  </MainLayout>
</template>

<style scoped>
input,
textarea,
select {
  outline: none;
}
</style>
