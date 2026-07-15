<template>
  <div class="map-view">
    <QuietMap />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import QuietMap from '../components/QuietMap.vue';

onMounted(() => {
  setTimeout(() => window.dispatchEvent(new Event('resize')), 200);
});
</script>

<style scoped>
.map-view {
  width: 100%;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.map-view > * {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
</style>