<template>
  <div class="card post-form">
    <h1>{{ isEdit ? '게시글 수정' : '새로운 글 작성' }}</h1>
    <form @submit.prevent="onSubmit" class="form" autocomplete="off">
      <div class="form-group">
        <label>제목</label>
        <input v-model="form.title" placeholder="제목을 입력하세요" required />
      </div>

      <div class="form-group">
        <label>내용</label>
        <textarea v-model="form.content" rows="15" placeholder="내용을 자유롭게 작성하세요" required></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>비밀번호</label>
          <input type="password" v-model="form.password" placeholder="비밀번호" :required="!isEdit" />
        </div>

        <div class="form-group autocomplete">
          <label>연관 장소</label>
          <input ref="placeInput" v-model="query" @input="onInput" @focus="openSuggestions"
            :class="{ 'is-linked': form.contentid }" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="chooseHighlighted" @blur="onBlur" placeholder="장소명 검색 (선택)" autocomplete="off" />
          <ul v-if="showSuggestions && suggestions.length" class="suggestions" role="listbox">
            <li v-for="(s, i) in suggestions" :key="s.contentid || i" :class="{
              highlighted: i === highlighted,
              'is-selected': String(s.contentid) === String(form.contentid)
            }" @mousedown.prevent="selectSuggestion(s)">
              <div class="s-title">
                {{ s.displayName }}
                <span v-if="String(s.contentid) === String(form.contentid)" class="check-mark">✓</span>
              </div>
              <div class="s-sub">{{ s.name }}</div>
            </li>
          </ul>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-cancel" type="button" @click="onCancel">취소</button>
        <button class="btn-submit" type="submit">{{ isEdit ? '수정 완료' : '등록하기' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePosts } from '@/composables/usePosts';
import { useQuietPlaces } from '@/composables/usePlaces';

const route = useRoute();
const router = useRouter();
const { get, create, update } = usePosts();
const { places, load: loadPlaces } = useQuietPlaces();

const isEdit = !!route.params.id;
const form = ref({
  title: '',
  content: '',
  password: '',
  placeTitle: '',
  contentid: null,
  lclsSystm3: null
});

function extractGu(p) {
  const addr = p.addr1 ?? p.addr ?? '';
  if (addr) {
    const parts = String(addr).split(/\s+/);
    const gu = parts.find(t => /.+구$/.test(t));
    if (gu) return gu;
  }
  if (p.sggNm && /.+구$/.test(p.sggNm)) return p.sggNm;
  if (p.sigunguNm && /.+구$/.test(p.sigunguNm)) return p.sigunguNm;
  return '';
}

const placeOptions = computed(() =>
  (places.value || [])
    .map(p => {
      const name = (p.placeTitle || p.title || p.facltNm || '').trim();
      const gu = extractGu(p);
      const displayName = gu ? `${name} (${gu})` : name;
      return { contentid: String(p.contentid ?? ''), lclsSystm3: p.lclsSystm3 || null, displayName, name };
    })
    .filter(o => o.displayName)
);

const query = ref('');
const showSuggestions = ref(false);
const highlighted = ref(-1);
const placeInput = ref(null);

onMounted(async () => {
  await loadPlaces();
  if (isEdit) {
    const existing = get(route.params.id);
    if (existing) {
      form.value.title = existing.title;
      form.value.content = existing.content;
      form.value.placeTitle = existing.placeTitle || '';
      form.value.contentid = existing.contentid ?? null;
      form.value.lclsSystm3 = existing.lclsSystm3 ?? null;
      query.value = form.value.placeTitle;
    }
  } else if (route.query.contentid) {
    const p = (places.value || []).find(x => String(x.contentid) === String(route.query.contentid));
    if (p) {
      form.value.placeTitle = (p.placeTitle || p.title || p.facltNm || '').trim();
      form.value.contentid = p.contentid ?? null;
      form.value.lclsSystm3 = p.lclsSystm3 ?? null;
      query.value = form.value.placeTitle;
    }
  }
});

const suggestions = computed(() => {
  const q = (query.value || '').trim().toLowerCase();
  if (!q) return [];
  return placeOptions.value
    .filter(p => (p.displayName || p.name || '').toLowerCase().includes(q))
    .slice(0, 12);
});

// 입력 시: 자동 선택 제거(사용자가 직접 선택하도록)
function onInput() {
  openSuggestions();
  highlighted.value = -1;
  form.value.contentid = null;
  form.value.lclsSystm3 = null;
  form.value.placeTitle = query.value;
}

function openSuggestions() {
  showSuggestions.value = true;
}

let blurTimeout = null;
function onBlur() {
  blurTimeout = setTimeout(() => {
    showSuggestions.value = false;
    highlighted.value = -1;
  }, 150);
}

function selectExact(p) {
  form.value.placeTitle = p.displayName;
  form.value.contentid = p.contentid || null;
  form.value.lclsSystm3 = p.lclsSystm3 || null;
  query.value = p.displayName;
  showSuggestions.value = false;
}

function selectSuggestion(p) {
  if (blurTimeout) { clearTimeout(blurTimeout); blurTimeout = null; }
  selectExact(p);
  placeInput.value && placeInput.value.focus();
}

function scrollHighlightedIntoView() {
  nextTick(() => {
    const list = document.querySelector('.suggestions');
    if (!list) return;
    const el = list.querySelector('li.highlighted');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest' });
    }
  });
}

function move(dir) {
  const len = suggestions.value.length;
  if (len === 0) return;
  if (highlighted.value === -1) {
    highlighted.value = dir > 0 ? 0 : len - 1;
  } else {
    highlighted.value = Math.max(0, Math.min(len - 1, highlighted.value + dir));
  }
  showSuggestions.value = true;
  scrollHighlightedIntoView();
}

function chooseHighlighted() {
  if (highlighted.value >= 0 && highlighted.value < suggestions.value.length) {
    selectSuggestion(suggestions.value[highlighted.value]);
    return;
  }
  // 하이라이트 없을 때: 엔터로 첫 항목 선택 허용 (유저 원하면 변경 가능)
  if (suggestions.value.length === 1) {
    selectSuggestion(suggestions.value[0]);
  } else if (suggestions.value.length > 0 && query.value.trim() !== '') {
    // 기본: 첫 항목을 선택
    selectSuggestion(suggestions.value[0]);
  }
}

function onSubmit() {
  if (isEdit) {
    const res = update(
      route.params.id,
      {
        title: form.value.title,
        content: form.value.content,
        placeTitle: form.value.placeTitle,
        contentid: form.value.contentid,
        lclsSystm3: form.value.lclsSystm3
      },
      form.value.password
    );
    if (res.ok) router.push({ name: 'BoardDetail', params: { id: route.params.id } });
    else alert('비밀번호가 틀렸습니다.');
  } else {
    const item = create({
      title: form.value.title,
      content: form.value.content,
      password: form.value.password,
      placeTitle: form.value.placeTitle,
      contentid: form.value.contentid,
      lclsSystm3: form.value.lclsSystm3
    });
    router.push({ name: 'BoardDetail', params: { id: item.id } });
  }
}

function onCancel() {
  router.back();
}
</script>

<style scoped>
.card {
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 24px;
  padding: 4rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 3rem;
  text-align: center;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: .8rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

label {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

input,
textarea {
  padding: 1.2rem 1.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 1.1rem;
  background: #fff;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(79,70,229,0.08);
}

.form-actions {
  display: flex;
  gap: 1.5rem;
  margin-top: 2rem;
}

button {
  flex: 1;
  padding: 1.2rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  border: none;
}

.btn-submit {
  background: #4f46e5;
  color: #fff;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.autocomplete {
  position: relative;
}

.suggestions {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  max-height: 280px;
  overflow: auto;
  padding: 6px 0;
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.08);
}

.suggestions li {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.suggestions li.highlighted {
  background-color: #4f46e5 !important;
  cursor: pointer;
}

.suggestions li.highlighted .s-title {
  color: #ffffff !important;
}

.suggestions li.highlighted .s-sub {
  color: #e0e7ff !important;
}

.suggestions li div {
  background-color: transparent !important;
}

.suggestions li:hover {
  background-color: #f1f5f9;
}

.s-title {
  font-weight: 700;
}

.s-sub {
  font-size: 12px;
  color: #64748b;
}

button:hover {
  transform: translateY(-3px);
  opacity: .9;
}

input.is-linked {
  border-color: #4f46e5;
  background-color: #f8faff;
  color: #4f46e5;
  font-weight: 700;
}

.suggestions li.is-selected {
  background-color: #f0f4ff;
}

.s-title {
  display: flex;
  justify-content: space-between;
}

.check-mark {
  color: #4f46e5;
  font-weight: 800;
}
</style>