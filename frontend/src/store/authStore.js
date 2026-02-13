import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setToken: (token) => {
        localStorage.setItem('token', token)
        set({ token, isAuthenticated: true })
        get().fetchUser()
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, token } = response.data
          localStorage.setItem('token', token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/register', data)
          const { user, token } = response.data
          localStorage.setItem('token', token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      fetchUser: async () => {
        const token = get().token || localStorage.getItem('token')
        if (!token) return

        set({ isLoading: true })
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data.user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          get().logout()
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.put('/auth/profile', data)
          set({ user: response.data.user, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Update failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      upgradeToSenior: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/upgrade')
          const { user, token } = response.data
          localStorage.setItem('token', token)
          set({ user, token, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Upgrade failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
)
