import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import api from '../api/axios'

/**
 * Helper to check if a JWT token is expired
 */
export function isTokenExpired(token) {
  if (!token) return true
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(payloadBase64))
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true
    }
    return false
  } catch (e) {
    return true
  }
}

// Clean up any legacy persistent auth stored in localStorage so closing the browser enforces logout
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('courier-auth')
  } catch (e) {}
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: null,
      lastActivity: Date.now(),

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          lastActivity: Date.now()
        })
        get().fetchPermissions()
      },

      logout: () => {
        try {
          sessionStorage.removeItem('courier-auth')
          localStorage.removeItem('courier-auth')
        } catch (e) {}
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: null,
          lastActivity: null
        })
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() })
      },

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData }
        })),

      fetchPermissions: async () => {
        try {
          const res = await api.get('/portal-users/me/permissions')
          if (res.data?.success) {
            set({ permissions: res.data.permissions })
            return res.data.permissions
          }
        } catch (err) {
          // If offline or super_admin fallback
        }
      },

      // ── Role Helpers ──
      isSuperAdmin: () => get().user?.role === 'super_admin',
      isAdmin: () => get().user?.role === 'admin' || get().user?.role === 'super_admin',
      getUserRole: () => get().user?.role || 'operator',
      
      /**
       * Check if user has permission for a specific module key.
       * Super Admin ALWAYS has full permission.
       * Normal Admin has permission unless explicitly restricted by Super Admin.
       */
      hasPermission: (moduleKey) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'super_admin') return true
        
        const perms = get().permissions
        if (!perms) {
          // Default: Normal Admin has access to all operational & config modules
          return user.role === 'admin'
        }
        return perms[moduleKey] !== false
      },

      getRoleLabel: () => {
        const role = get().user?.role
        if (role === 'super_admin') return 'Super Admin'
        if (role === 'admin') return 'Admin'
        if (role === 'operator') return 'Operator'
        if (role === 'viewer') return 'Viewer'
        return 'Staff'
      }
    }),
    {
      name: 'courier-auth',
      // Stored in sessionStorage so session automatically ends and auto-logs out when the browser is closed
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        lastActivity: state.lastActivity
      })
    }
  )
)
