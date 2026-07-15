<template>
  <div ref="mapEl" style="height:600px"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useQuietPlaces } from '@/composables/usePlaces';
import { usePosts, posts as postsRef } from '@/composables/usePosts';
import { enrichPlaces } from '@/composables/useQuietScore';
import { quietColor, quietLabel } from '@/data/categories';

const mapEl = ref(null);
let map = null;
let markerLayer = null;

const { places, load: loadPlaces } = useQuietPlaces();
const postsModule = usePosts(); // 필요 시 함수 사용
// postsRef는 export한 반응형 참조
const posts = postsRef;

async function initMap() {
  map = L.map(mapEl.value, { preferCanvas: true }).setView([37.5665, 126.9780], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
}

function updateMarkers() {
  if (!markerLayer) return;
  markerLayer.clearLayers();
  const enriched = enrichPlaces(places.value || [], posts.value || []);
  for (const place of enriched) {
    const lat = Number(place.mapy) || Number(place.mapy2) || (place.latitude && Number(place.latitude));
    const lng = Number(place.mapx) || Number(place.mapx2) || (place.longitude && Number(place.longitude));
    if (!lat || !lng) continue;

    const score = place.finalQuiet ?? 0;
    const color = quietColor(score);
    const radius = 8 + (place.reviewCount || 0) * 1.5;

    const marker = L.circleMarker([lat, lng], {
      radius,
      color,
      fillColor: color,
      fillOpacity: 0.9,
      weight: 1
    });

    const popupHtml = `
      <div>
        <strong>${place.title || place.title === undefined ? place.title : '무명 장소'}</strong><br/>
        조용함 점수: <strong>${score}</strong> (${place.reviewCount || 0}건)<br/>
        ${place.addr1 ? `<div>${place.addr1}</div>` : ''}
        <div style="margin-top:6px;">
          <a href="#/map" onclick="return true;">지도에서 보기</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml);
    marker.addTo(markerLayer);
  }
}

onMounted(async () => {
  await loadPlaces();
  await Promise.resolve(); // 보장
  await initMap();
  updateMarkers();
});

// posts 또는 places가 바뀌면 갱신
watch([places, posts], () => {
  updateMarkers();
}, { deep: true });

// 깨끗한 정리
onBeforeUnmount(() => {
  if (map) map.remove();
});
</script>

<style scoped>
/* 필요시 스타일 조정 */
</style>