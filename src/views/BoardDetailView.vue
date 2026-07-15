<template>
    <div v-if="post">
        <h1>{{ post.title }}</h1>
        <p>{{ post.content }}</p>
        <p><small>작성일: {{ post.createdAt ? new Date(post.createdAt).toLocaleString() : '-' }}</small></p>
        <p v-if="post.placeTitle"><strong>장소:</strong> {{ post.placeTitle }}</p>
        <button @click="goEdit">수정</button>
        <button @click="onDelete">삭제</button>
        <button @click="goList">목록으로</button>
    </div>
    <div v-else>
        <p>게시글을 찾을 수 없습니다.</p>
        <button @click="goList">목록으로</button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePosts } from '@/composables/usePosts';

const route = useRoute();
const router = useRouter();
const { get, remove } = usePosts();

const post = ref(get(route.params.id) || null);

function goEdit() {
    if (!post.value) return;
    router.push({ name: 'PostEdit', params: { id: post.value.id } });
}

function goList() {
    router.push({ name: 'BoardList' });
}

function onDelete() {
    if (!post.value) return;
    const pw = prompt('삭제 비밀번호를 입력하세요');
    if (!pw) return;
    const res = remove(post.value.id, pw);
    if (!res.ok) alert(res.reason || '삭제 실패');
    else {
        alert('삭제되었습니다.');
        router.push({ name: 'BoardList' });
    }
}
</script>