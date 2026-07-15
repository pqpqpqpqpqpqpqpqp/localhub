import { ref } from 'vue';

// 모듈 스코프의 반응형 상태 — 앱 전체에서 공유됩니다.
const places = ref([]);
const loaded = ref(false);
const loading = ref(false);
let pendingPromise = null;

function _jsonToItems(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.items)) return json.items;
  return [];
}

export async function load() {
  if (loaded.value) return places.value;
  if (loading.value && pendingPromise) return pendingPromise;

  loading.value = true;
  const url = `${import.meta.env.BASE_URL || '/'}data/quiet_places_seoul.json`;

  pendingPromise = fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
      return res.json();
    })
    .then(json => {
      places.value = _jsonToItems(json);
      loaded.value = true;
      return places.value;
    })
    .catch(err => {
      console.error('load quiet places failed', err);
      throw err;
    })
    .finally(() => {
      loading.value = false;
      pendingPromise = null;
    });

  return pendingPromise;
}

export function getByContentId(contentid) {
  return (places.value || []).find(p => p.contentid === contentid) ?? null;
}

export function useQuietPlaces() {
  return { places, loaded, loading, load, getByContentId };
}