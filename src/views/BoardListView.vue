<template>
    <div>
        <h1>게시판</h1>
        <button @click="goCreate">글쓰기</button>
        <ul>
            <li v-for="p in posts" :key="p.id">
                <router-link :to="{ name: 'BoardDetail', params: { id: p.id } }">{{ p.title || '(제목없음)' }}</router-link>
                <small>— {{ p.createdAt ? new Date(p.createdAt).toLocaleString() : '' }}</small>
                <button @click="goEdit(p.id)">수정</button>
                <button @click="onDelete(p.id)">삭제</button>
            </li>
        </ul>
        <div v-if="posts.length === 0">등록된 글이 없습니다.</div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePosts } from '@/composables/usePosts';

const router = useRouter();
const { list, remove } = usePosts();
const posts = ref(list());

function refresh() {
    posts.value = list();
}

function goCreate() {
    router.push({ name: 'PostCreate' });
}

function goEdit(id) {
    router.push({ name: 'PostEdit', params: { id } });
}

function onDelete(id) {
    const pw = prompt('삭제할 게시글의 비밀번호를 입력하세요');
    if (!pw) return;
    const res = remove(id, pw);
    if (!res.ok) alert(res.reason || '삭제 실패');
    else {
        alert('삭제되었습니다.');
        refresh();
    }
}
</script>