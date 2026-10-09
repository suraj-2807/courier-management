import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Route guard that restricts access to Super Admin users only.
 * Standard admins and operators are redirected to the dashboard.
 */
export default function SuperAdminRoute({ children }) {
  const { isAuthenticated, isSuperAdmin } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />
  }

  return children
}
