import { create } from 'zustand'
import api from '../api/client'

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  boutiqueId: localStorage.getItem('boutiqueId') || '',
  boutiqueType: localStorage.getItem('boutiqueType') || '',

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user } = res.data
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    const boutiqueId = user.boutiqueId || ''
    const boutiqueType = user.boutiqueType || ''
    if (boutiqueId) localStorage.setItem('boutiqueId', boutiqueId)
    if (boutiqueType) localStorage.setItem('boutiqueType', boutiqueType)
    set({ user, token, boutiqueId, boutiqueType })
    return user
  },

  setBoutique: (boutiqueId, boutiqueType = '') => {
    localStorage.setItem('boutiqueId', boutiqueId)
    if (boutiqueType) {
      localStorage.setItem('boutiqueType', boutiqueType)
    } else {
      localStorage.removeItem('boutiqueType')
    }
    set({ boutiqueId, boutiqueType })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('boutiqueId')
    localStorage.removeItem('boutiqueType')
    set({ user: null, token: null, boutiqueId: '', boutiqueType: '' })
  },

  isAuthenticated: () => !!localStorage.getItem('token'),
}))

export default useAuthStore
