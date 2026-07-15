/**
 * [비즈니스 로직] 익명 게시판 CRUD 기능
 * - LocalStorage를 사용해 브라우저에 글 저장/삭제/수정
 * - 백엔드 DB 없이 데이터를 관리하는 핵심 '도구 상자'
 */
import { ref } from 'vue';

const STORAGE_KEY = 'localhub:posts';

// 모듈 스코프의 반응형 상태 — 앱 전체에서 공유됩니다.
const posts = ref(loadFromLocal());

/**
 * 비밀번호는 서버가 없으므로 평문 비교합니다 (보안상 위험).
 */

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
      quietScore:
        typeof data.quietScore !== 'undefined'
          ? Number(data.quietScore)
          : 1,
      title: data.title ?? '',
      content: data.content ?? '',
      // 비밀번호는 평문으로 저장(서버 없음)
      password: data.password ?? '',
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

  return { list, get, byContentId, create, update, remove };
}
