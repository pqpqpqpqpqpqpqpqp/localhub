<template>
  <div>
    <h1>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h1>
    <form @submit.prevent="onSubmit">
      <div>
        <label>제목</label>
        <input v-model="form.title" required />
      </div>
      <div>
        <label>내용</label>
        <textarea v-model="form.content" required></textarea>
      </div>
      <div>
        <label>비밀번호 (수정/삭제 시 필요)</label>
        <input type="password" v-model="form.password" required />
      </div>
      <div>
        <label>연관 장소 (선택)</label>
        <input v-model="form.placeTitle" placeholder="장소명" />
      </div>
      <div style="margin-top:8px;">
        <button type="submit">{{ isEdit ? '저장' : '작성' }}</button>
        <button type="button" @click="onCancel">취소</button>
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
    } else {
      alert('편집할 게시글을 찾을 수 없습니다.');
      router.push({ name: 'BoardList' });
    }
  }
});

function onSubmit() {
  if (isEdit) {
    const res = update(route.params.id, {
      title: form.value.title,
      content: form.value.content,
      placeTitle: form.value.placeTitle
    }, form.value.password);
    if (!res.ok) {
      if (res.reason === 'wrong_password') alert('비밀번호가 틀렸습니다.');
      else alert('수정 실패');
      return;
    }
    router.push({ name: 'BoardDetail', params: { id: route.params.id } });
  } else {
    const item = create({
      title: form.value.title,
      content: form.value.content,
      password: form.value.password,
      placeTitle: form.value.placeTitle
    });
    router.push({ name: 'BoardDetail', params: { id: item.id } });
  }
}

function onCancel() {
  router.back();
}
</script>