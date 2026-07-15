import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'
import BoardListView from '@/views/BoardListView.vue'
import BoardDetialView from '@/views/BoardDetialView.vue'
import PostFormView from '@/views/PostFormView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/board', name: 'BoardList', component: BoardListView },
  { path: '/board/:id', name: 'BoardDetail', component: BoardDetialView, props: true },
  { path: '/post', name: 'PostForm', component: PostFormView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router