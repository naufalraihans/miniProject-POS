<template>
  <div id="app-wrapper">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import NavBar from "./components/NavBar.vue";
</script>
