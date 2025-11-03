<script setup>
import MainLayout from '../layout/MainLayout.vue';
</script>

<template>
  <MainLayout>
    <h1 class="text-2xl font-bold mb-4">Google Books (VueJS)</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <p>This is Fucking About</p>
      <!-- <BookCard v-for="book in books" :key="book.id" :book="book" /> -->
    </div>
  </MainLayout>
</template>
