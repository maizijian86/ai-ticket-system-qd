import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTicketStore } from '@/stores/ticket'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    redirect: '/tickets',
    children: [
      {
        path: 'tickets',
        name: 'TicketList',
        component: () => import('@/views/ticket/TicketList.vue'),
        meta: { requiresAuth: false }
      },
      {
        path: 'tickets/new',
        name: 'TicketCreate',
        component: () => import('@/views/ticket/TicketCreate.vue')
      },
      {
        path: 'tickets/:id',
        name: 'TicketDetail',
        component: () => import('@/views/ticket/TicketDetail.vue')
      },
      {
        path: 'tickets/:id/edit',
        name: 'TicketEdit',
        component: () => import('@/views/ticket/TicketEdit.vue')
      },
      {
        path: 'my-tickets',
        name: 'MyTickets',
        component: () => import('@/views/ticket/MyTickets.vue')
      },
      {
        path: 'pending',
        name: 'PendingTickets',
        component: () => import('@/views/ticket/PendingTickets.vue')
      },
      {
        path: 'accepted',
        name: 'AcceptedTickets',
        component: () => import('@/views/ticket/AcceptedTickets.vue')
      },
      {
        path: 'completed',
        name: 'CompletedTickets',
        component: () => import('@/views/ticket/CompletedTickets.vue')
      },
      {
        path: 'knowledge',
        name: 'Knowledge',
        component: () => import('@/views/knowledge/Knowledge.vue')
      },
      {
        path: 'admin/users',
        name: 'UserManage',
        component: () => import('@/views/admin/UserManage.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'admin/stats',
        name: 'Stats',
        component: () => import('@/views/admin/Stats.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const ticketStore = useTicketStore()

  if (to.meta.requiresAuth !== false && !authStore.token) {
    // 触发登录弹窗，保存待跳转路径，不导航
    ticketStore.triggerAuthModal(to.fullPath)
    // 不调用 next()，留在当前页面，等用户登录后再处理
    return
  } else if (to.meta.requiresAdmin && authStore.userInfo?.role !== 'ADMIN') {
    next('/tickets')
  } else if (to.path === '/login' && authStore.token) {
    next('/tickets')
  } else {
    next()
  }
})

export default router
