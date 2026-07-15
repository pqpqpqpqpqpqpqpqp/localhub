<template>
  <div class="quiet-map-wrap">
    <div id="quiet-map"></div>
    <template v-if="!isHome">
      <!-- 필터 열기/닫기 버튼 -->
      <button class="filter-fab" @click="togglePanel" type="button">
        {{ showFilter ? '✕ 닫기' : '☰ 필터' }}
      </button>

      <!-- 조용함 지수 범례 -->
      <div class="legend">
        <div class="legend-title">조용함 지수</div>
        <div class="legend-item"><span class="dot" style="background:#0B6E6E"></span>아주 조용 (4.5+)</div>
        <div class="legend-item"><span class="dot" style="background:#3AA6A6"></span>조용 (3.5+)</div>
        <div class="legend-item"><span class="dot" style="background:#8FB8B8"></span>보통 (2.5+)</div>
        <div class="legend-item"><span class="dot" style="background:#B0B0B0"></span>시끄러움</div>
      </div>

      <!-- 필터 패널 -->
      <div class="filter-panel" :class="{ open: showFilter }" @click.self="onPanelBackgroundClick">
        <div class="panel-inner" :class="{ mobile: isMobile }">
          <header class="panel-header">
            <h3>필터</h3>
          </header>

          <section class="filter-section">
            <label class="section-title">카테고리</label>
            <div class="chips">
              <button v-for="c in CATEGORIES" :key="c.code"
                :class="['chip', { active: selectedCategories.has(c.code) }]" @click="toggleCategory(c.code)"
                type="button">
                <span class="emoji">{{ c.emoji }}</span>
                <span class="name">{{ c.name }}</span>
              </button>
            </div>
          </section>

          <section class="filter-section">
            <label class="section-title">자치구</label>
            <select v-model="selectedGu">
              <option value="">전체</option>
              <option v-for="g in guOptions" :key="g" :value="g">{{ g }}</option>
            </select>
          </section>

          <section class="filter-section">
            <label class="section-title">조용함 정도</label>
            <div class="quiet-levels">
              <button v-for="lv in QUIET_LEVELS" :key="lv.value"
                :class="['level-btn', { active: quietLevel === lv.value }]" @click="quietLevel = lv.value"
                type="button">
                {{ lv.label }}
              </button>
            </div>
          </section>

          <footer class="panel-footer">
            <button class="reset" @click="resetFilters" type="button">초기화</button>
            <button class="apply" @click="applyFilters" type="button">적용</button>
          </footer>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { useQuietPlaces } from '../composables/usePlaces';
import { usePosts } from '../composables/usePosts';
import { enrichPlaces } from '../composables/useQuietScore';
import { quietColor, quietLabel, CATEGORIES } from '../data/categories';

const router = useRouter();

const props = defineProps({
  isHome: {
    type: Boolean,
    default: false
  }
});

let map = null;
let clusterLayer = null;

const { places, load: loadPlaces } = useQuietPlaces();
const { list: listPosts } = usePosts();

// 조용함 등급 필터 (색상 기준과 동일: 이상 개념)
const QUIET_LEVELS = [
  { value: 0, label: '전체' },
  { value: 2.5, label: '보통 이상' },
  { value: 3.5, label: '조용 이상' },
  { value: 4.5, label: '아주 조용' },
];

// UI state
const showFilter = ref(false);
const isMobile = ref(false);
const selectedCategories = ref(new Set(CATEGORIES.map(c => c.code)));
const selectedGu = ref('');
const quietLevel = ref(0); // 0 = 전체

const emojiByCode = Object.fromEntries(CATEGORIES.map(c => [c.code, c.emoji]));

const enrichedPlaces = computed(() => enrichPlaces(places.value || [], listPosts() || []));

const guOptions = computed(() => {
  const set = new Set();
  for (const p of places.value || []) {
    const addr = p.addr1 ?? p.addr ?? p.address ?? '';
    if (addr) {
      const parts = String(addr).split(/\s+/);
      const gu = parts.find(t => /.+구$/.test(t));
      if (gu) set.add(gu);
    }
    if (p.sggNm && /.+구$/.test(p.sggNm)) set.add(p.sggNm);
    if (p.sigunguNm && /.+구$/.test(p.sigunguNm)) set.add(p.sigunguNm);
  }
  return Array.from(set).filter(Boolean).sort();
});

const filteredEnriched = computed(() => {
  return (enrichedPlaces.value || []).filter(place => {
    if (selectedCategories.value.size > 0) {
      const code = place.lclsSystm3 ?? place.lclsSystm3Code ?? '';
      if (!selectedCategories.value.has(code)) return false;
    }
    if (selectedGu.value) {
      const addr = place.addr1 ?? place.addr ?? '';
      if (!String(addr).includes(selectedGu.value)) return false;
    }
    // 조용함 등급: 선택한 값 이상만 표시 (0이면 전체)
    if (quietLevel.value > 0) {
      if (typeof place.finalQuiet !== 'number' || place.finalQuiet < quietLevel.value) {
        return false;
      }
    }
    return true;
  });
});

function toggleCategory(code) {
  const s = selectedCategories.value;
  if (s.has(code)) s.delete(code);
  else s.add(code);
  selectedCategories.value = new Set([...s]);
}

function resetFilters() {
  selectedCategories.value = new Set(CATEGORIES.map(c => c.code));
  selectedGu.value = '';
  quietLevel.value = 0;
}

function applyFilters() {
  showFilter.value = false;
  renderMarkers();
}

function togglePanel() {
  showFilter.value = !showFilter.value;
}

function onPanelBackgroundClick() {
  if (isMobile.value) showFilter.value = false;
}

function _toLatLng(place) {
  const lat = Number(place.mapy ?? place.lat ?? place.latitude);
  const lng = Number(place.mapx ?? place.lng ?? place.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return L.latLng(lat, lng);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, ch => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
  });
}

function renderMarkers() {
  if (!map || !clusterLayer) return;
  clusterLayer.clearLayers();

  const markers = [];
  for (const place of filteredEnriched.value) {
    const latlng = _toLatLng(place);
    if (!latlng) continue;

    const color = quietColor(place.finalQuiet);
    const marker = L.circleMarker(latlng, {
      radius: 8,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    });

    const title = escapeHtml(place.title ?? place.placeTitle ?? place.facltNm ?? '이름 없음');
    const address = escapeHtml(place.addr1 ?? place.addr ?? '');
    const quiet = typeof place.finalQuiet === 'number' ? place.finalQuiet.toFixed(1) : '-';
    const label = quietLabel(place.finalQuiet);
    const reviews = typeof place.reviewCount !== 'undefined' ? place.reviewCount : 0;
    const contentid = escapeHtml(place.contentid ?? '');
    const emoji = emojiByCode[place.lclsSystm3] || '📍';

    const image = place.firstimage2 || place.firstimage || '';
    const imageHtml = image
      ? `<img src="${image}" class="popup-thumb" onerror="this.style.display='none'" />`
      : `<div class="popup-thumb popup-thumb-empty">이미지 없음</div>`;

    const popupHtml = `
      <div class="popup-content">
        ${imageHtml}
        <div class="popup-title">${emoji} ${title}</div>
        <div class="popup-addr">${address}</div>
        <div class="popup-quiet">
          <span class="quiet-badge" style="background:${color}">${quiet}</span>
          <span class="quiet-label">${label} · 리뷰 ${reviews}건</span>
        </div>
        <button class="write-review-btn" data-write-btn data-contentid="${contentid}">이 장소 리뷰 쓰기</button>
      </div>
    `;

    marker.bindPopup(popupHtml, { minWidth: 210 });
    markers.push(marker);
  }
  clusterLayer.addLayers(markers);
}

function onPopupOpen(e) {
  const popupEl = (e.popup && typeof e.popup.getElement === 'function') ? e.popup.getElement() : (e.popup && e.popup._contentNode) || null;
  if (!popupEl) return;
  const btn = popupEl.querySelector && popupEl.querySelector('[data-write-btn]');
  if (!btn) return;

  const handler = () => {
    const contentid = btn.dataset.contentid;
    const place = enrichedPlaces.value.find(p => p.contentid === contentid);
    router.push({
      path: '/write',
      query: {
        contentid: contentid ?? '',
        placeTitle: place?.placeTitle ?? place?.title ?? '',
        lclsSystm3: place?.lclsSystm3 ?? ''
      }
    });
  };
  btn.__writeHandler = handler;
  btn.addEventListener('click', handler);
}

function onPopupClose(e) {
  const popupEl = (e.popup && typeof e.popup.getElement === 'function') ? e.popup.getElement() : (e.popup && e.popup._contentNode) || null;
  if (!popupEl) return;
  const btn = popupEl.querySelector && popupEl.querySelector('[data-write-btn]');
  if (!btn) return;
  if (btn.__writeHandler) {
    btn.removeEventListener('click', btn.__writeHandler);
    delete btn.__writeHandler;
  }
}

function updateIsMobile() {
  isMobile.value = window.matchMedia('(max-width:767px)').matches;
}

onMounted(async () => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  showFilter.value = false;

  await loadPlaces();

  map = L.map('quiet-map').setView([37.5665, 126.9780], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | 출처: 한국관광공사 TourAPI'
  }).addTo(map);

  clusterLayer = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true
  });
  map.addLayer(clusterLayer);

  renderMarkers();

  map.on('popupopen', onPopupOpen);
  map.on('popupclose', onPopupClose);

  watch(filteredEnriched, () => {
    renderMarkers();
  });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile);
  if (map) {
    map.off('popupopen', onPopupOpen);
    map.off('popupclose', onPopupClose);
    if (clusterLayer) {
      clusterLayer.clearLayers();
      clusterLayer = null;
    }
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.quiet-map-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 500px;
}

#quiet-map {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.filter-fab {
  position: fixed;
  top: 72px;
  right: 16px;
  z-index: 2100;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #0b6e6e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.legend {
  position: fixed;
  left: 16px;
  bottom: 32px;
  z-index: 1500;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  font-size: 12px;
}

.legend-title {
  font-weight: 700;
  margin-bottom: 6px;
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0;
  color: #555;
}

.legend .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #ddd;
}

.filter-panel {
  position: fixed;
  top: 72px;
  right: 16px;
  width: 300px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transform: translateX(24px);
  pointer-events: none;
  transition: transform 200ms ease, opacity 200ms ease;
}

.filter-panel.open {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

@media (max-width: 767px) {
  .filter-fab {
    top: auto;
    bottom: 16px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }

  .legend {
    left: 8px;
    bottom: 80px;
    font-size: 11px;
    padding: 8px 10px;
  }

  .filter-panel {
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
    transform: translateY(100%);
  }

  .filter-panel.open {
    transform: translateY(0);
  }
}

.panel-inner {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 13px;
  color: #555;
}

.filter-section select {
  width: 100%;
  -webkit-appearance: auto;
  appearance: auto;
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

/* 조용함 등급 버튼 */
.quiet-levels {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.level-btn {
  flex: 1 1 calc(50% - 6px);
  padding: 8px 6px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.level-btn.active {
  background: #0b6e6e;
  color: #fff;
  border-color: #0b6e6e;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
}

.chip.active {
  background: linear-gradient(90deg, #e6fffb, #e0fffc);
  border-color: #3aa6a6;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04);
}

.chip .emoji {
  font-size: 14px;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.panel-footer .reset,
.panel-footer .apply {
  flex: 1;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.panel-footer .reset {
  background: #f5f5f5;
}

.panel-footer .apply {
  background: #0b6e6e;
  color: #fff;
}

.leaflet-popup-content .popup-title {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
}

.leaflet-popup-content .popup-addr {
  font-size: 12px;
  color: #777;
  margin-bottom: 6px;
}

.leaflet-popup-content .popup-quiet {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.leaflet-popup-content .quiet-badge {
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 10px;
}

.leaflet-popup-content .quiet-label {
  font-size: 12px;
  color: #555;
}

.leaflet-popup-content .write-review-btn {
  width: 100%;
  padding: 7px 8px;
  background: #0b6e6e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.leaflet-popup-content .popup-thumb {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 6px;
  display: block;
}

.leaflet-popup-content .popup-thumb-empty {
  width: 100%;
  height: 110px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #eef4f4;
  color: #8fb8b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
</style>