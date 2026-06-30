import { create } from 'zustand'
import api from '../api/client'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  boutiqueId: localStorage.getItem('boutiqueId') || '',

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    const boutiqueId = user.boutiqueId || ''
    if (boutiqueId) localStorage.setItem('boutiqueId', boutiqueId)
    set({ user, token, boutiqueId })
    return user
  },

  setBoutique: (boutiqueId) => {
    localStorage.setItem('boutiqueId', boutiqueId)
    set({ boutiqueId })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('boutiqueId')
    set({ user: null, token: null, boutiqueId: '' })
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
}))

export default useAuthStore
