import { Navigate } from 'react-router-dom'
import { useAuthStore, isTokenExpired } from '../store/authStore'

/**
 * Route guard that enforces module permissions.
 * Super Admin always has full access.
 * Normal Admin has access to all modules unless explicitly restricted by Super Admin.
 */
export default function PermissionRoute({ module, children }) {
  const { isAuthenticated, token, logout, isSuperAdmin, hasPermission } = useAuthStore()

  if (!isAuthenticated || !token || isTokenExpired(token)) {
    if (token && isTokenExpired(token)) {
      logout()
    }
    return <Navigate to="/login" replace />
  }

  if (isSuperAdmin()) {
    return children
  }

  if (module && !hasPermission(module)) {
    return <Navigate to="/" replace />
  }

  return children
}
