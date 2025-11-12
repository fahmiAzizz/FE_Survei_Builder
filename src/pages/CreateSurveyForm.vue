<script setup>
import { ref } from "vue";
import axios from "axios";
import Swal from "sweetalert2";
import {
  showLoading,
  showSuccess,
  showConfirm,
  handleApiError,
} from "../utils/swal.js";

const apiUrl = import.meta.env.VITE_API_URL;

const emit = defineEmits(["close", "created"]);

const form = ref({
  name: "",
  description: "",
  created_by: 1,
  sessions: [
    {
      name: "",
      order: 1,
      allow_multiple: false,
      questions: [
        {
          question_text: "",
          type: "text",
          required: false,
          order: 1,
          options: [],
          subQuestions: [],
        },
      ],
    },
  ],
});

const addSession = () => {
  form.value.sessions.push({
    name: "",
    order: form.value.sessions.length + 1,
    allow_multiple: false,
    questions: [
      {
        question_text: "",
        type: "text",
        required: false,
        order: 1,
        options: [],
        subQuestions: [],
      },
    ],
  });
};

const removeSession = async (sIndex) => {
  const result = await showConfirm(
    "Yakin ingin menghapus sesi ini beserta semua pertanyaan di dalamnya?"
  );
  if (result == true) {
    form.value.sessions.splice(sIndex, 1);
    showSuccess("Sesi dihapus", "Sesi dan pertanyaan berhasil dihapus.");
  }
};

const addQuestion = (sessionIndex) => {
  form.value.sessions[sessionIndex].questions.push({
    question_text: "",
    type: "text",
    required: false,
    order: form.value.sessions[sessionIndex].questions.length + 1,
    options: [],
    subQuestions: [],
  });
};

const addOption = (sessionIndex, questionIndex) => {
  form.value.sessions[sessionIndex].questions[questionIndex].options.push("");
};

const addSubOption = (sessionIndex, questionIndex, subIndex) => {
  form.value.sessions[sessionIndex].questions[questionIndex].subQuestions[
    subIndex
  ].options.push("");
};

const removeQuestion = (sessionIndex, questionIndex) => {
  form.value.sessions[sessionIndex].questions.splice(questionIndex, 1);
};

const addSubQuestion = (sessionIndex, questionIndex) => {
  form.value.sessions[sessionIndex].questions[questionIndex].subQuestions.push({
    question_text: "",
    type: "text",
    required: false,
    order:
      form.value.sessions[sessionIndex].questions[questionIndex].subQuestions
        .length + 1,
    options: [],
  });
};

const removeSubQuestion = (sessionIndex, questionIndex, subIndex) => {
  form.value.sessions[sessionIndex].questions[
    questionIndex
  ].subQuestions.splice(subIndex, 1);
};

const duplicateQuestion = (sessionIndex, questionIndex) => {
  const questionToCopy =
    form.value.sessions[sessionIndex].questions[questionIndex];
  const cloned = JSON.parse(JSON.stringify(questionToCopy));
  cloned.order = form.value.sessions[sessionIndex].questions.length + 1;
  form.value.sessions[sessionIndex].questions.splice(
    questionIndex + 1,
    0,
    cloned
  );
};

const createSurvey = async () => {
  try {
    showLoading("Menyimpan survei...");

    const res = await axios.post(`${apiUrl}survei`, form.value, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    Swal.close();
    await showSuccess("Survei berhasil dibuat!", "Data survei telah disimpan.");
    emit("created", res.data);
  } catch (err) {
    handleApiError(err, "Gagal membuat survei");
  }
};
</script>

<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center"
  >
    <div
      class="bg-white rounded-xl p-6 w-full max-w-3xl overflow-y-auto max-h-[90vh]"
    >
      <h2 class="text-xl font-bold mb-4">Buat Survei Baru</h2>

      <label class="block mb-2 font-semibold">Nama Survei</label>
      <input v-model="form.name" class="w-full border rounded p-2 mb-4" />

      <label class="block mb-2 font-semibold">Deskripsi</label>
      <textarea
        v-model="form.description"
        class="w-full border rounded p-2 mb-4"
      ></textarea>

      <div
        v-for="(s, sIndex) in form.sessions"
        :key="sIndex"
        class="border rounded-lg p-4 mb-4"
      >
        <div class="flex justify-items-center justify-between p-2">
          <h3 class="font-semibold mb-2">Session {{ sIndex + 1 }}</h3>
          <button
            @click="removeSession(sIndex)"
            class="bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            🗑 Hapus Session
          </button>
        </div>

        <input
          v-model="s.name"
          placeholder="Nama sesi"
          class="w-full border rounded p-2 mb-2"
          required
        />

        <label class="flex items-center space-x-2 mb-3">
          <input type="checkbox" v-model="s.allow_multiple" />
          <span>Izinkan pengisian berulang (multiple entries)</span>
        </label>

        <div
          v-for="(q, qIndex) in s.questions"
          :key="qIndex"
          class="border-t pt-3 mt-3 relative"
        >
          <div class="absolute top-1 right-1 flex gap-2 text-sm">
            <button
              @click="duplicateQuestion(sIndex, qIndex)"
              type="button"
              class="text-blue-500"
            >
              📄
            </button>
            <button
              @click="removeQuestion(sIndex, qIndex)"
              type="button"
              class="text-red-500"
            >
              ❌
            </button>
          </div>

          <label>Pertanyaan {{ qIndex + 1 }}</label>
          <input
            v-model="q.question_text"
            placeholder="Tulis pertanyaan"
            class="w-full border rounded p-2 mb-2"
            required
          />

          <label>Jenis Pertanyaan:</label>
          <select v-model="q.type" class="w-full border rounded p-2 mb-2">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="dropdown">Dropdown</option>
            <option value="checkbox">Checkbox</option>
            <option value="rating">Rating</option>
          </select>

          <!-- OPSI UNTUK dropdown & checkbox -->
          <div v-if="q.type === 'dropdown' || q.type === 'checkbox'">
            <label>Opsi Jawaban:</label>
            <div
              v-for="(opt, oIndex) in q.options"
              :key="oIndex"
              class="flex gap-2 mb-2"
            >
              <input
                v-model="q.options[oIndex]"
                placeholder="Isi opsi"
                class="flex-1 border rounded p-2"
              />
              <button
                @click="q.options.splice(oIndex, 1)"
                type="button"
                class="text-red-500"
              >
                ❌
              </button>
            </div>
            <button
              @click="addOption(sIndex, qIndex)"
              type="button"
              class="text-blue-500 text-sm"
            >
              + Tambah Opsi
            </button>
          </div>

          <!-- SUB-QUESTION -->
          <div class="mt-3 border-l-2 pl-3">
            <div
              v-for="(sub, subIndex) in q.subQuestions"
              :key="subIndex"
              class="border rounded p-2 mb-2 relative"
            >
              <button
                @click="removeSubQuestion(sIndex, qIndex, subIndex)"
                type="button"
                class="absolute top-1 right-1 text-red-500 text-sm"
              >
                ❌
              </button>

              <label>Sub-Pertanyaan:</label>
              <input
                v-model="sub.question_text"
                placeholder="Tulis sub-pertanyaan"
                class="w-full border rounded p-2 mb-2"
              />

              <select v-model="sub.type" class="w-full border rounded p-2 mb-2">
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="date">Date</option>
                <option value="dropdown">Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="rating">Rating</option>
              </select>

              <!-- OPSI SUB-QUESTION -->
              <div
                v-if="sub.type === 'dropdown' || sub.type === 'checkbox'"
                class="pl-2 border-l mt-2"
              >
                <label>Opsi Sub Jawaban:</label>
                <div
                  v-for="(opt, oIndex) in sub.options"
                  :key="oIndex"
                  class="flex gap-2 mb-2"
                >
                  <input
                    v-model="sub.options[oIndex]"
                    placeholder="Isi opsi"
                    class="flex-1 border rounded p-2"
                  />
                  <button
                    @click="sub.options.splice(oIndex, 1)"
                    type="button"
                    class="text-red-500"
                  >
                    ❌
                  </button>
                </div>
                <button
                  @click="addSubOption(sIndex, qIndex, subIndex)"
                  type="button"
                  class="text-blue-500 text-sm"
                >
                  + Tambah Opsi
                </button>
              </div>
            </div>

            <button
              @click="addSubQuestion(sIndex, qIndex)"
              type="button"
              class="text-blue-500 text-sm"
            >
              + Tambah Sub-Pertanyaan
            </button>
          </div>
        </div>

        <button
          @click="addQuestion(sIndex)"
          type="button"
          class="mt-3 text-blue-600"
        >
          + Tambah Pertanyaan
        </button>
      </div>

      <button @click="addSession" type="button" class="text-blue-600 mb-4">
        + Tambah Sesi
      </button>

      <div class="flex justify-end gap-3">
        <button @click="emit('close')" class="bg-gray-300 px-4 py-2 rounded-lg">
          Batal
        </button>
        <button
          @click="createSurvey"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Simpan
        </button>
      </div>
    </div>
  </div>
</template>
