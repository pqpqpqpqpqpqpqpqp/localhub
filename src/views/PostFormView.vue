<template>
  <div class="card post-form">
    <h1>{{ isEdit ? '게시글 수정' : '새로운 글 작성' }}</h1>
    <form @submit.prevent="onSubmit" class="form">
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
        <div class="form-group">
          <label>연관 장소</label>
          <input v-model="form.placeTitle" placeholder="장소명 (선택)" />
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePosts } from '@/composables/usePosts';

const route = useRoute();
const router = useRouter();
const { get, create, update } = usePosts();

const isEdit = !!route.params.id;
const form = ref({ title: '', content: '', password: '', placeTitle: '' });

onMounted(() => {
  if (isEdit) {
    const p = get(route.params.id);
    if (p) {
      form.value.title = p.title;
      form.value.content = p.content;
      form.value.placeTitle = p.placeTitle || '';
    }
  }
});

function onSubmit() {
  if (isEdit) {
    const res = update(route.params.id, { title: form.value.title, content: form.value.content, placeTitle: form.value.placeTitle }, form.value.password);
    if (res.ok) router.push({ name: 'BoardDetail', params: { id: route.params.id } });
    else alert('비밀번호가 틀렸습니다.');
  } else {
    const item = create({ ...form.value });
    router.push({ name: 'BoardDetail', params: { id: item.id } });
  }
}
function onCancel() { router.back(); }
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
  gap: 0.8rem;
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
  transition: all 0.3s;
  background: #ffffff;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #4f46e5;
  border-width: 2px;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
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
  transition: 0.2s;
  border: none;
}

.btn-submit {
  background: #4f46e5;
  color: white;
}

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

button:hover {
  transform: translateY(-3px);
  opacity: 0.9;
}
</style>