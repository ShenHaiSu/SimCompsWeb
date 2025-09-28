import { defineStore } from 'pinia'
import { ref } from 'vue'


export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(null)

  // 操作（actions）
  function login(newToken: string) {
    token.value = newToken
  }

  function logout() {
    token.value = null
  }

  return {
    token,
    login,
    logout
  }
})
