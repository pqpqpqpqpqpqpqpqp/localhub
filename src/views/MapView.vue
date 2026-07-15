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
  width: 80vw;
  height: 50vh; /* 화면 전체 높이에 맞춤 */
  min-height: 500px;
}

/* 자식 컴포넌트의 루트 노드가 부모 높이를 물려받도록 보장 */
.map-view > * {
  height: 100%;
}
</style>