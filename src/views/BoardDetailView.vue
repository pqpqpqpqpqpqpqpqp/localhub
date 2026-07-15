<template>
    <div class="card board-detail" v-if="post">
        <header class="detail-header">
            <div class="category">커뮤니티</div>
            <h1 class="title">{{ post.title }}</h1>
            <div class="meta-bar">
                <span class="date">📅 {{ post.createdAt ? new Date(post.createdAt).toLocaleString() : '-' }}</span>
                <span class="views">👀 조회수 {{ post.views ?? 0 }}</span>
                <span class="likes">👍 좋아요 {{ post.likes ?? 0 }}</span>
            </div>
        </header>

        <section class="content-body">
            <div class="text-content">{{ post.content }}</div>
            <div v-if="post.placeTitle" class="place-tag">
                📍 <strong>연관 장소:</strong> {{ post.placeTitle }}
            </div>
        </section>

        <footer class="detail-actions">
            <div class="left">
                <button class="btn-list" @click="goList">목록으로</button>
            </div>
            <div class="right">
                <button class="btn-edit" @click="goEdit">수정하기</button>
                <button class="btn-like" :class="{ active: liked }" @click="onToggleLike">
                    {{ liked ? '❤️ 좋아요 취소' : '🤍 좋아요' }}
                </button>
                <button class="btn-delete" @click="onDelete">삭제</button>
            </div>
        </footer>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePosts } from '@/composables/usePosts';

const route = useRoute();
const router = useRouter();
const { get, remove, incrementView, toggleLike, isLiked } = usePosts();

const post = computed(() => get(route.params.id));
const liked = ref(false);

onMounted(() => {
    if (route.params.id) {
        incrementView(route.params.id);
        liked.value = isLiked(route.params.id);
    }
});

function goEdit() { router.push({ name: 'PostEdit', params: { id: post.value.id } }); }
function goList() { router.push({ name: 'BoardList' }); }
function onToggleLike() {
    const res = toggleLike(route.params.id);
    liked.value = res.liked;
}
function onDelete() {
    const pw = prompt('삭제 비밀번호를 입력하세요');
    if (pw === null) return;
    const res = remove(post.value.id, pw);
    if (res.ok) router.push({ name: 'BoardList' });
    else alert('비밀번호가 틀렸습니다.');
}
</script>

<style scoped>
.card {
    background: white;
    border-radius: 20px;
    padding: 0;
    border: 1px solid #e2e8f0;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.detail-header {
    padding: 4rem 5rem 3rem;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.category {
    color: #4f46e5;
    font-weight: 700;
    margin-bottom: 1rem;
    font-size: 1.1rem;
}

.title {
    font-size: 2.8rem;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 1.5rem;
    line-height: 1.2;
}

.meta-bar {
    display: flex;
    gap: 2rem;
    color: #94a3b8;
    font-size: 1rem;
}

.content-body {
    padding: 4rem 5rem;
    min-height: 400px;
}

.text-content {
    font-size: 1.25rem;
    line-height: 2;
    color: #334155;
    white-space: pre-wrap;
}

.place-tag {
    margin-top: 4rem;
    padding: 1.2rem 2rem;
    background: #ffffff;
    border: 1px solid #bae6fd;
    border-radius: 12px;
    color: #0369a1;
    display: inline-block;
    font-size: 1.1rem;
    box-shadow: 0 2px 8px rgba(3, 105, 161, 0.05);
}

.detail-actions {
    padding: 2rem 5rem;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.right {
    display: flex;
    gap: 12px;
}

button {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
}

.btn-list {
    background: #ffffff;
    color: #475569;
    border-color: #e2e8f0;
}

.btn-list:hover {
    background: #f1f5f9;
}

.btn-edit {
    background: #4f46e5;
    color: white;
}

.btn-edit:hover {
    background: #4338ca;
    transform: translateY(-2px);
}

.btn-like {
    background: #ffffff;
    color: #e11d48;
    border-color: #ffe4e6;
}

.btn-like:hover {
    background: #fff1f2;
}

.btn-like.active {
    background: #e11d48;
    color: white;
    border-color: #e11d48;
}

.btn-delete {
    background: #ffffff;
    color: #ef4444;
    border-color: #fee2e2;
}

.btn-delete:hover {
    background: #fef2f2;
}
</style>