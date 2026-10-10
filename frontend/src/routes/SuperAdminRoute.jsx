import { Navigate } from 'react-router-dom'
import { useAuthStore, isTokenExpired } from '../store/authStore'

/**
 * Route guard that restricts access to Super Admin users only.
 * Standard admins and operators are redirected to the dashboard.
 */
export default function SuperAdminRoute({ children }) {
  const { isAuthenticated, token, logout, isSuperAdmin } = useAuthStore()

  if (!isAuthenticated || !token || isTokenExpired(token)) {
    if (token && isTokenExpired(token)) {
      logout()
    }
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />
  }

  return children
}
