<template>
  <div>
    <header class="site-header">
      <nav>
        <router-link to="/">Home</router-link>
        <router-link to="/map">Map</router-link>
        <router-link to="/board">Board</router-link>
        <router-link to="/post">Write</router-link>
      </nav>
    </header>

    <main>
      <slot />
    </main>

    <footer class="site-footer">
      <small>LocalHub — Seoul</small>
    </footer>
  </div>
</template>

<script setup></script>

<style scoped>
.site-header { padding: 12px; background:#f5f5f5; }
.site-header nav a { margin-right:12px; }
.site-footer { padding:12px; text-align:center; background:#fafafa; margin-top:24px; }
</style>