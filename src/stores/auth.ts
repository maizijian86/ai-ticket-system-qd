import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserDTO, LoginResponse, GithubRepo } from '@/types'
import { authApi } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserDTO | null>(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'ADMIN')
  const isHandler = computed(() => true) // All users can handle tickets

  async function login(username: string, password: string) {
    const res = await authApi.login({ username, password })
    setAuthData(res)
    return res
  }

  async function register(data: { username: string; password: string; nickname?: string; githubUsername?: string; githubRepos?: GithubRepo[]; role?: string }) {
    return await authApi.register(data)
  }

  function setAuthData(data: LoginResponse) {
    token.value = data.token
    userInfo.value = {
      id: data.userId,
      username: data.username,
      role: data.role as any,
      nickname: data.nickname,
      email: '',
      status: 'active'
    }

    localStorage.setItem('token', data.token)
    localStorage.setItem('userId', String(data.userId))
    localStorage.setItem('userName', data.nickname || data.username)
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    isHandler,
    login,
    register,
    logout
  }
})
