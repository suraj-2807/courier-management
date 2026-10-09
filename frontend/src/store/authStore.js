import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/axios'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: null,

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true
        })
        get().fetchPermissions()
      },

      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          permissions: null
        }),

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
        if (role === 'admin') return 'Normal Admin'
        if (role === 'operator') return 'Operator'
        if (role === 'viewer') return 'Viewer'
        return 'Staff'
      }
    }),
    {
      name: 'courier-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions
      })
    }
  )
)
