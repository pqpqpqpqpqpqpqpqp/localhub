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

    <ChatBot />

    <footer class="site-footer">
      <div class="container footer-inner">
        <small>LocalHub — Seoul · © { new Date().getFullYear() }</small>
      </div>
    </footer>
  </div>
</template>

<script setup>
import ChatBot from '@/components/ChatBot.vue';
</script>

<style scoped>
.site-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f1f5f9;
  color: #1e293b;
  font-family: var(--font-stack);
}

.site-header {
  background-color: var(--color-surface);
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 40px;
}

.header-inner {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
  cursor: pointer;
  letter-spacing: -0.5px;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: var(--color-muted);
  font-weight: 500;
  transition: color 0.18s;
}
.nav-link:hover,
.router-link-active { color: var(--color-text); }
.nav-cta {
  background-color: var(--color-primary);
  color: var(--color-surface);
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: background 0.18s;
}
.nav-cta:hover { background-color: var(--color-primary-600); }

.main-content {
  flex: 1;
  padding-top: 2rem;
  padding-bottom: 4rem;
  width: 100%;
  box-sizing: border-box;
}

.site-footer {
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 2rem 0;
  color: #94a3b8;
  text-align: center;
}

.card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
  padding: 3.5rem;
}
</style>