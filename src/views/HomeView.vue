<template>
    <div class="home-page">
        <section class="hero card">
            <div class="hero-left">
                <h1>LocalHub — 서울의 조용한 쉼터</h1>
                <p>도심의 소음과 인파에 지친 당신을 위한, 서울의 가장 조용한 쉼터를 찾아드립니다.</p>
                <div class="hero-ctas">
                    <button class="btn" @click="goMap">지도에서 찾기</button>
                    <button class="btn ghost" @click="goBoard">조용함 리뷰 보기</button>
                </div>
            </div>
            <div class="hero-right">
                <QuietMap class="mini-map" is-home />
            </div>
        </section>

        <section class="spot-panel">
            <div class="card list-card">
                <h3>인기 조용한 장소</h3>
                <ul>
                    <li v-for="p in topPlaces" :key="p.contentid">
                        <button class="link-like" @click="openPlace(p)">{{ p.placeTitle ?? p.title ?? p.facltNm }} <span
                                class="quiet">· 조용함 {{ p.finalQuiet ?? '-' }}</span></button>
                    </li>
                </ul>
            </div>

            <div class="card list-card">
                <h3>최근 게시글</h3>
                <ul>
                    <li v-for="p in recentPosts" :key="p.id">
                        <router-link :to="{ name: 'BoardDetail', params: { id: p.id } }">{{ p.title || '(제목없음)'
                        }}</router-link>
                        <div class="meta">{{ p.createdAt ? new Date(p.createdAt).toLocaleString() : '' }} · 조회 {{
                            p.views ?? 0 }}</div>
                    </li>
                </ul>
                <div class="more">
                    <button class="small" @click="goBoard">게시판으로 →</button>
                    <button class="small ghost" @click="goWrite">글쓰기</button>
                </div>
            </div>
        </section>

    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import QuietMap from '@/components/QuietMap.vue';
import { useQuietPlaces } from '@/composables/usePlaces';
import { usePosts } from '@/composables/usePosts';
import { enrichPlaces } from '@/composables/useQuietScore';

const router = useRouter();
const { places, load } = useQuietPlaces();
const { list } = usePosts();

const recentPosts = computed(() => list().slice(0, 6));

const enriched = computed(() => enrichPlaces(places.value || [], list() || []));
const topPlaces = computed(() =>
    (enriched.value || [])
        .slice()
        .sort((a, b) => (b.finalQuiet ?? 0) - (a.finalQuiet ?? 0))
        .slice(0, 6)
);

onMounted(async () => {
    await load();
});

function goMap() { router.push({ name: 'Map' }); }
function goBoard() { router.push({ name: 'BoardList' }); }
function goWrite() { router.push({ name: 'PostCreate' }); }

function openPlace(p) {
    router.push({ name: 'Map', query: { contentid: p.contentid ?? '' } });
}
</script>

<style scoped>
.home-page {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 2rem 1rem 4rem;
    background: linear-gradient(180deg, #f8fbfb 0%, #f1f5f9 100%);
}

/* 공통 카드 스타일 강화 */
.card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.6rem;
    box-shadow: 0 4px 10px rgba(2, 6, 23, 0.06);
    border: 1px solid rgba(15, 23, 42, 0.08);
    transition: transform 160ms ease, box-shadow 160ms ease;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 18px 40px rgba(14, 30, 37, 0.08);
}

/* Hero (강조 영역) */
.hero {
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 1.5rem;
    align-items: center;
    padding: 1.8rem;
    border-left: 4px solid #4f46e5;
    /* 액센트 라인 */
}

.hero-left h1 {
    margin: 0 0 0.6rem 0;
    font-size: 1.8rem;
    color: #0f172a;
    letter-spacing: -0.2px;
}

.hero-left p {
    margin: 0 0 1rem 0;
    color: #475569;
    font-size: 1rem;
}

.hero-ctas {
    display: flex;
    gap: 0.6rem;
    align-items: center;
}

/* 버튼 스타일 정리 */
.btn {
    background: #4f46e5;
    color: #fff;
    padding: 0.7rem 1rem;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    box-shadow: 0 6px 16px rgba(79, 70, 229, 0.12);
}

.btn.ghost {
    background: transparent;
    border: 1px solid #e6eefb;
    color: #475569;
    box-shadow: none;
}

/* 미니맵 박스 강조 */
.mini-map {
    width: 100%;
    height: 220px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(3, 105, 161, 0.12);
    box-shadow: inset 0 -8px 20px rgba(3, 105, 161, 0.02);
    background: linear-gradient(180deg, #ffffff, #fbffff);
}

/* Spot & Posts 영역 — 카드 구분 보강 */
.spot-panel {
    display: grid;
    grid-template-columns: 1fr 420px;
    gap: 1rem;
}

/* 리스트 카드 내부 헤더 스타일 */
.list-card h3 {
    margin: 0 0 0.8rem 0;
    font-size: 1.05rem;
    color: #0f172a;
    padding-bottom: 0.6rem;
    border-bottom: 1px dashed rgba(15, 23, 42, 0.06);
}

/* 목록 아이템 스타일 — 구분선, 호버 강조 */
.list-card ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.list-card li {
    padding: 0.6rem 0.4rem;
    border-radius: 8px;
    transition: background 120ms ease;
    border-bottom: 1px solid rgba(15, 23, 42, 0.04);
}

.list-card li:hover {
    background: rgba(79, 70, 229, 0.03);
}

/* 링크형 버튼을 더 명확하게 */
.link-like {
    background: none;
    border: none;
    padding: 0;
    text-align: left;
    color: #0f172a;
    cursor: pointer;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* 조용함 태그 강조 */
.quiet {
    color: #0ea5a4;
    font-weight: 700;
    font-size: 0.95rem;
}

/* 게시글 메타 */
.meta {
    color: #64748b;
    font-size: 0.9rem;
    margin-top: 0.25rem;
}

/* 작은 액션 버튼 */
.more {
    margin-top: 0.6rem;
    display: flex;
    gap: 0.6rem;
    align-items: center;
}

.small {
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
    background: #f8fafc;
    border: 1px solid #eef2ff;
    cursor: pointer;
    font-weight: 700;
}

.small.ghost {
    background: transparent;
    border: 1px solid #e6eefb;
}

/* 반응형 조정 */
@media (max-width: 980px) {
    .hero {
        grid-template-columns: 1fr;
        border-left: none;
        padding: 1.2rem;
    }

    .mini-map {
        height: 200px;
    }

    .spot-panel {
        grid-template-columns: 1fr;
    }

    .card {
        padding: 1.2rem;
    }
}

/* 아주 좁은 화면에서도 최소 가독성 확보 */
@media (max-width: 420px) {
    .hero-left h1 {
        font-size: 1.25rem;
    }

    .mini-map {
        height: 160px;
    }

    .home-page {
        padding: 1rem;
    }
}
</style>