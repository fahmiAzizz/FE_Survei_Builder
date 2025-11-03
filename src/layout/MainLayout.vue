<template>
  <div class="min-h-screen bg-gray-100">
    <Navbar />
    <main class="p-6"><slot /></main>
  </div>
</template>

<script setup>
import Navbar from '../components/Navbar.vue';
</script>
