<script setup></script>

<template>
  <DefaultLayout>
    <router-view />
  </DefaultLayout>
</template>

<script>
import DefaultLayout from '@/layouts/DefaultLayout.vue'
export default { components: { DefaultLayout } }
</script>

<style scoped></style>