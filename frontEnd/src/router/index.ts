import { createRouter, createWebHistory } from 'vue-router'

// 分支 View 路由引入
import { homeRoute } from '@/router/module/home'
import { aboutRoute } from '@/router/module/about'

// 中间件引入


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 首页路由
    homeRoute,
    // 关于路由
    aboutRoute,
  ],
})

export default router
