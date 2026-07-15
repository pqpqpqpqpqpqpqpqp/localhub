import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import MapView from '../views/MapView.vue';
import BoardListView from '../views/BoardListView.vue';
import BoardDetailView from '../views/BoardDetailView.vue';
import PostFormView from '../views/PostFormView.vue';

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/board', name: 'BoardList', component: BoardListView },
  { path: '/board/:id', name: 'BoardDetail', component: BoardDetailView, props: true },
  { path: '/write', name: 'PostCreate', component: PostFormView },
  { path: '/board/:id/edit', name: 'PostEdit', component: PostFormView, props: true }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;