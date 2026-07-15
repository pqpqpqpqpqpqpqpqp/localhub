import { ref } from 'vue';

const STORAGE_KEY = 'localhub:posts';

export const posts = ref(loadFromLocal());

function loadFromLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts.value));
}

function sortByNewest(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export function usePosts() {
  function list() {
    return [...posts.value].sort(sortByNewest);
  }

  function get(id) {
    return posts.value.find(p => p.id === id) ?? null;
  }

  function byContentId(contentid) {
    return posts.value
      .filter(p => p.contentid === contentid)
      .sort(sortByNewest);
  }

  function create(data) {
    const now = new Date().toISOString();
    const item = {
      id: crypto.randomUUID(),
      contentid: data.contentid ?? null,
      placeTitle: data.placeTitle ?? '',
      lclsSystm3: data.lclsSystm3 ?? null,
      quietScore: typeof data.quietScore !== 'undefined' ? Number(data.quietScore) : 1,
      title: data.title ?? '',
      content: data.content ?? '',
      password: data.password ?? '',
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now
    };
    posts.value.push(item);
    saveToLocal();
    return item;
  }

  function update(id, data, password) {
    const idx = posts.value.findIndex(p => p.id === id);
    if (idx === -1) return { ok: false, reason: 'not_found' };

    const existing = posts.value[idx];
    if (existing.password !== password) return { ok: false, reason: 'wrong_password' };

    // 허용 필드만 업데이트
    if (typeof data.title !== 'undefined') existing.title = data.title;
    if (typeof data.content !== 'undefined') existing.content = data.content;
    if (typeof data.placeTitle !== 'undefined') existing.placeTitle = data.placeTitle;
    if (typeof data.lclsSystm3 !== 'undefined') existing.lclsSystm3 = data.lclsSystm3;
    if (typeof data.quietScore !== 'undefined') existing.quietScore = Number(data.quietScore);
    existing.updatedAt = new Date().toISOString();

    posts.value.splice(idx, 1, existing);
    saveToLocal();
    return { ok: true };
  }

  function remove(id, password) {
    const idx = posts.value.findIndex(p => p.id === id);
    if (idx === -1) return { ok: false, reason: 'not_found' };

    const existing = posts.value[idx];
    if (existing.password !== password) return { ok: false, reason: 'wrong_password' };

    posts.value.splice(idx, 1);
    saveToLocal();
    return { ok: true };
  }

  // usePosts() 반환에 추가할 함수들 (파일 내에 위치)
  function incrementView(id) {
    const idx = posts.value.findIndex(p => p.id === id);
    if (idx === -1) return null;
    posts.value[idx].views = (Number(posts.value[idx].views) || 0) + 1;
    posts.value[idx].updatedAt = new Date().toISOString();
    saveToLocal();
    return posts.value[idx].views;
  }

  const LIKED_KEY = 'localhub:liked';
  function _loadLiked() {
    try { return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || '[]')); } catch { return new Set(); }
  }
  function _saveLiked(set) { localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(set))); }

  function toggleLike(id) {
    const idx = posts.value.findIndex(p => p.id === id);
    if (idx === -1) return { ok: false };
    const liked = _loadLiked();
    const already = liked.has(id);
    if (already) {
      posts.value[idx].likes = Math.max(0, (posts.value[idx].likes || 0) - 1);
      liked.delete(id);
    } else {
      posts.value[idx].likes = (posts.value[idx].likes || 0) + 1;
      liked.add(id);
    }
    _saveLiked(liked);
    saveToLocal();
    return { ok: true, liked: !already, likes: posts.value[idx].likes };
  }

  function isLiked(id) {
    return _loadLiked().has(id);
  }

  return { list, get, byContentId, create, update, remove, posts, incrementView, toggleLike, isLiked };
}
