<template>
  <div class="site-root">
    <header class="site-header">
      <div class="container header-inner">
        <div class="brand" @click="$router.push({ name: 'Home' })">LocalHub</div>
        <nav class="main-nav">
          <router-link :to="{ name: 'Home' }" class="nav-link">Home</router-link>
          <router-link :to="{ name: 'Map' }" class="nav-link">Map</router-link>
          <router-link :to="{ name: 'BoardList' }" class="nav-link">Board</router-link>
          <router-link :to="{ name: 'PostCreate' }" class="nav-cta">Write</router-link>
        </nav>
      </div>
    </header>

    <main class="container main-content">
      <slot />
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <small>LocalHub — Seoul · © { new Date().getFullYear() }</small>
      </div>
    </footer>
  </div>
</template>

<script setup></script>

<style scoped>
:root{
  --bg:#fbfdff;
  --card:#ffffff;
  --muted:#6b7280;
  --accent:#0b6e6e;
  --accent-2:#3aa6a6;
  --header-bg: #ffffff;
  --shadow: 0 6px 18px rgba(13, 18, 23, 0.06);
  --radius: 10px;
}

/* 레이아웃 기본 */
.site-root { background: var(--bg); color: #0f1724; min-height:100vh; display:flex; flex-direction:column; }

/* 컨테이너 공통 */
.container { max-width:1100px; margin:0 auto; padding:0 16px; box-sizing:border-box; }

/* 헤더 */
.site-header {
  background: var(--header-bg);
  border-bottom: 1px solid #eef2f6;
  position: sticky;
  top: 0;
  z-index: 60;
  backdrop-filter: blur(6px);
}
.header-inner {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:14px 0;
}
.brand {
  font-weight:700;
  color:var(--accent);
  font-size:1.15rem;
  cursor:pointer;
  letter-spacing:0.4px;
}

/* 내비 */
.main-nav { display:flex; gap:10px; align-items:center; }
.nav-link {
  color:var(--muted);
  padding:8px 12px;
  border-radius:8px;
  text-decoration:none;
  transition:all .15s ease;
  font-weight:600;
  font-size:0.95rem;
}
.nav-link:hover { background:#f3faf9; color:var(--accent-2); transform:translateY(-1px); }
.nav-cta {
  background: linear-gradient(90deg,var(--accent),var(--accent-2));
  color:#fff;
  padding:8px 14px;
  border-radius:10px;
  box-shadow: 0 6px 18px rgba(10,110,110,0.12);
  text-decoration:none;
  font-weight:700;
}
.nav-cta:hover { transform:translateY(-1px); }

/* 메인 */
.main-content {
  flex:1;
  padding:28px 0;
  min-height:60vh;
  display:block;
}

/* 푸터 */
.site-footer {
  border-top:1px solid #eef2f6;
  background: linear-gradient(180deg,#ffffff,#fbfdff);
  padding:18px 0;
}
.footer-inner { text-align:center; color:var(--muted); font-size:0.9rem; }

/* 카드 스타일 유틸리티 (뷰에서 사용 가능) */
.card {
  background:var(--card);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  padding:16px;
  display:block;
}

/* 반응형 */
@media (max-width:720px){
  .header-inner { gap:8px; }
  .main-nav { gap:6px; }
  .nav-link { padding:7px 8px; font-size:0.9rem; }
  .nav-cta { padding:7px 10px; font-size:0.9rem; }
  .brand { font-size:1rem; }
  .container { padding:0 12px; }
}
</style>