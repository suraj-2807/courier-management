import { Navigate } from 'react-router-dom'
import { useAuthStore, isTokenExpired } from '../store/authStore'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, token, logout } = useAuthStore()

  if (!isAuthenticated || !token || isTokenExpired(token)) {
    if (token && isTokenExpired(token)) {
      logout()
    }
    return <Navigate to="/login" replace />
  }

  return children
}
