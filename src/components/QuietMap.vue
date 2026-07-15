<template>
  <div class="quiet-map-wrap">
    <div id="quiet-map"></div>

    <div :class="['filter-panel', { open: panelOpen }]" @click.self="onPanelBackgroundClick">
      <div class="panel-inner" :class="{ mobile: isMobile }">
        <header class="panel-header">
          <h3>필터</h3>
          <button class="toggle-btn" @click.stop="togglePanel">{{ panelOpen ? '닫기' : '열기' }}</button>
        </header>

        <section class="filter-section">
          <label class="section-title">카테고리</label>
          <div class="chips">
            <button
              v-for="c in CATEGORIES"
              :key="c.code"
              :class="['chip', { active: selectedCategories.has(c.code) }]"
              @click="toggleCategory(c.code)"
              type="button"
            >
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
          <label class="section-title">최소 조용함 지수: {{ minQuiet }}</label>
          <input type="range" min="1" max="5" step="0.1" v-model.number="minQuiet" />
        </section>

        <footer class="panel-footer">
          <button class="reset" @click="resetFilters">초기화</button>
          <button class="apply" @click="applyFilters">적용</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuietPlaces } from '../composables/usePlaces';
import { usePosts } from '../composables/usePosts';
import { enrichPlaces } from '../composables/useQuietScore';
import { quietColor, CATEGORIES } from '../data/categories';

const router = useRouter();

let map = null;
let markersLayer = null;

const { places, load: loadPlaces } = useQuietPlaces();
const { list: listPosts } = usePosts();

// UI state
const panelOpen = ref(false);
const isMobile = ref(false);
const selectedCategories = ref(new Set(CATEGORIES.map(c => c.code)));
const selectedGu = ref('');
const minQuiet = ref(1.0);

// derived/enriched data
const enrichedPlaces = computed(() => {
  return enrichPlaces(places.value || [], listPosts() || []);
});

// gu options extracted from place address fields
const guOptions = computed(() => {
  const set = new Set();
  for (const p of places.value || []) {
    const addr = p.addr1 ?? p.addr ?? p.address ?? '';
    if (addr) {
      const parts = String(addr).split(/\s+/);
      const gu = parts.find(t => /구$|시$/.test(t));
      if (gu) set.add(gu);
    }
    if (p.sggNm) set.add(p.sggNm);
    if (p.sigunguNm) set.add(p.sigunguNm);
  }
  return Array.from(set).filter(Boolean).sort();
});

// filtered/enriched by UI
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
    if (typeof place.finalQuiet === 'number') {
      if (place.finalQuiet < minQuiet.value) return false;
    } else {
      return false;
    }
    return true;
  });
});

// helpers
function toggleCategory(code) {
  const s = selectedCategories.value;
  if (s.has(code)) s.delete(code);
  else s.add(code);
  selectedCategories.value = new Set([...s]);
}

function resetFilters() {
  selectedCategories.value = new Set(CATEGORIES.map(c => c.code));
  selectedGu.value = '';
  minQuiet.value = 1.0;
}

function applyFilters() {
  panelOpen.value = false;
  renderMarkers();
}

function togglePanel() {
  panelOpen.value = !panelOpen.value;
}

function onPanelBackgroundClick() {
  if (isMobile.value) panelOpen.value = false;
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
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();
  const bounds = map.getBounds();

  for (const place of filteredEnriched.value) {
    const latlng = _toLatLng(place);
    if (!latlng) continue;
    if (!bounds.contains(latlng)) continue;

    const color = quietColor(place.finalQuiet);
    const marker = L.circleMarker(latlng, {
      radius: 8,
      fillColor: color,
      color,
      weight: 1,
      opacity: 1,
      fillOpacity: 0.9
    });

    const title = escapeHtml(place.title ?? place.placeTitle ?? place.facltNm ?? '이름 없음');
    const address = escapeHtml(place.addr1 ?? place.addr ?? '');
    const quiet = typeof place.finalQuiet !== 'undefined' ? place.finalQuiet : '-';
    const reviews = typeof place.reviewCount !== 'undefined' ? place.reviewCount : 0;
    const contentid = escapeHtml(place.contentid ?? '');

    const popupHtml = `
      <div class="popup-content">
        <strong>${title}</strong><br/>
        ${address}<br/>
        조용함 지수: ${quiet}<br/>
        리뷰: ${reviews}<br/>
        <button class="write-review-btn" data-write-btn data-contentid="${contentid}">이 장소 리뷰 쓰기</button>
      </div>
    `;

    marker.bindPopup(popupHtml);
    markersLayer.addLayer(marker);
  }
}

// popupopen handler: attach click listener to '이 장소 리뷰 쓰기' button
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
  // store handler on element so we can remove it later
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

// responsive detection
function updateIsMobile() {
  isMobile.value = window.matchMedia('(max-width:767px)').matches;
}

onMounted(async () => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  await loadPlaces();

  map = L.map('quiet-map').setView([37.5665, 126.9780], 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors | 출처: 한국관광공사 TourAPI'
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  renderMarkers();

  map.on('moveend', renderMarkers);
  map.on('popupopen', onPopupOpen);
  map.on('popupclose', onPopupClose);

  watch([filteredEnriched], () => {
    renderMarkers();
  }, { deep: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile);
  if (map) {
    map.off('moveend', renderMarkers);
    map.off('popupopen', onPopupOpen);
    map.off('popupclose', onPopupClose);
    if (markersLayer) {
      markersLayer.clearLayers();
      markersLayer = null;
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

/* Panel base */
.filter-panel {
  position: fixed;
  z-index: 1000;
  transition: transform 240ms ease, opacity 240ms ease;
}

/* Desktop: fixed top-right card */
@media (min-width: 768px) {
  .filter-panel {
    top: 16px;
    right: 16px;
    transform: translateY(0);
    opacity: 1;
  }
  .filter-panel .panel-inner {
    width: 300px;
    background: rgba(255,255,255,0.95);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
  }
}

/* Mobile: bottom sheet, collapsed by default */
@media (max-width: 767px) {
  .filter-panel {
    left: 0;
    right: 0;
    bottom: 0;
    height: auto;
    pointer-events: none;
  }
  .filter-panel .panel-inner {
    pointer-events: auto;
    width: 100%;
    background: #fff;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding: 12px;
    box-shadow: 0 -6px 18px rgba(0,0,0,0.12);
    transform: translateY(88%);
  }
  .filter-panel.open .panel-inner {
    transform: translateY(0);
  }
  .filter-panel .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

/* Shared inner layout */
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

.toggle-btn {
  background: transparent;
  border: none;
  color: #333;
  cursor: pointer;
  font-weight: 600;
}

/* filter sections */
.filter-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 13px;
  color: #555;
}

/* chips */
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
  background: linear-gradient(90deg,#e6fffb,#e0fffc);
  border-color: #3aa6a6;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}

.chip .emoji {
  font-size: 14px;
}

/* footer buttons */
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

/* popup button styling */
.leaflet-popup-content .write-review-btn {
  margin-top: 8px;
  padding: 6px 8px;
  background: #0b6e6e;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
</style>