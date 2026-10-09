import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Route guard that enforces module permissions.
 * Super Admin always has full access.
 * Normal Admin has access to all modules unless explicitly restricted by Super Admin.
 */
export default function PermissionRoute({ module, children }) {
  const { isAuthenticated, isSuperAdmin, hasPermission } = useAuthStore()

  if (!isAuthenticated) {
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
