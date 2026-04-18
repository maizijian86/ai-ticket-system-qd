import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTicketStore = defineStore('ticket', () => {
  const refreshTrigger = ref(0)
  const showAuthModal = ref(false)
  const pendingPath = ref<string | null>(null)
  const authModalMode = ref<'login' | 'register'>('login')

  function triggerRefresh() {
    refreshTrigger.value++
  }

  function triggerAuthModal(path?: string, mode: 'login' | 'register' = 'login') {
    pendingPath.value = path || null
    showAuthModal.value = true
    authModalMode.value = mode
  }

  return {
    refreshTrigger,
    showAuthModal,
    pendingPath,
    authModalMode,
    triggerRefresh,
    triggerAuthModal
  }
})
