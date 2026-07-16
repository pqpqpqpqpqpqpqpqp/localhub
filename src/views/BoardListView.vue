<template>
    <div class="card board-list">
        <div class="header">
            <h1>게시판</h1>
            <button class="primary" @click="goCreate">글쓰기</button>
        </div>

        <div class="list-wrapper">
            <ul class="list">
                <li v-for="p in posts" :key="p.id" class="item">
                    <div class="post-info">
                        <router-link :to="{ name: 'BoardDetail', params: { id: p.id } }" class="title">
                            {{ p.title || '(제목없음)' }}
                        </router-link>
                        <div class="sub-info">
                            <span class="time">{{ p.createdAt ? new Date(p.createdAt).toLocaleString() : '' }}</span>
                            <span class="divider">|</span>
                            <span class="badge">조회 {{ p.views ?? 0 }}</span>
                            <span class="badge">추천 {{ p.likes ?? 0 }}</span>
                        </div>
                    </div>

                    <div class="actions">
                        <button class="btn-icon" title="수정" @click="goEdit(p.id)">📝 수정</button>
                        <button :class="['btn-like', { active: isLiked(p.id) }]" @click="onToggleLike(p.id)">
                            {{ isLiked(p.id) ? '❤️ 추천됨' : '🤍 추천' }}
                        </button>
                        <button class="btn-danger" @click="onDelete(p.id)">삭제</button>
                    </div>
                </li>
            </ul>
        </div>

        <div v-if="posts.length === 0" class="empty">등록된 게시글이 없습니다. 첫 글을 작성해보세요!</div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePosts } from '@/composables/usePosts';

const router = useRouter();
const { list, get, remove, toggleLike, isLiked } = usePosts();
const posts = computed(() => list());

function goCreate() { router.push({ name: 'PostCreate' }); }
function goEdit(id) { router.push({ name: 'PostEdit', params: { id } }); }
function onToggleLike(id) { toggleLike(id); }

function onDelete(id) {
    const existing = get(id);
    if (!existing) return;
    const pw = prompt('삭제 비밀번호를 입력하세요');
    if (pw === null) return;
    const res = remove(id, pw);
    if (!res.ok) alert(res.reason === 'wrong_password' ? '비밀번호가 틀렸습니다.' : '삭제 실패');
}
</script>

<style scoped>
.card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    padding: 3.5rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #f1f5f9;
}

h1 {
    font-size: 2.2rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
}

.list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.8rem 1.5rem;
    border: 1px solid #f1f5f9;
.title:hover { color: var(--color-primary); }
    background: #ffffff;
}

.item:hover {
    background-color: #f8fafc;
    border-color: #4f46e5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.post-info {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #1e293b;
    text-decoration: none;
}

.title:hover {
    color: #4f46e5;
}

.sub-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    color: #94a3b8;
    font-size: 0.95rem;
}

.divider {
    color: #e2e8f0;
}

.actions {
    display: flex;
    gap: 12px;
}

button {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s;
}

.primary {
    background: #4f46e5;
    color: white;
}

.btn-like {
    background: #fef2f2;
    color: #e11d48;
    border-color: #ffe4e6;
}

.btn-like:hover {
    background: #e11d48;
    color: white;
}

.btn-like.active {
    background: #e11d48;
    color: white;
}

.btn-danger {
    background: white;
    color: #ef4444;
    border-color: #fee2e2;
}

.btn-danger:hover {
    background: #ef4444;
    color: white;
}

.btn-icon {
    background: #f1f5f9;
    color: #475569;
    border-color: #e2e8f0;
}

.btn-icon:hover {
    background: #475569;
    color: white;
}

.empty {
    text-align: center;
    padding: 6rem 0;
    color: #94a3b8;
    font-size: 1.2rem;
}
</style>