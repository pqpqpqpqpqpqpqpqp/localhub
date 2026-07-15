<template>
  <div class="map-view">
    <QuietMap />
  </div>
</template>

<script setup>
import QuietMap from '../components/QuietMap.vue';
</script>

<style scoped>
.map-view {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.map-view > * {
  height: 100%;
}
</style>